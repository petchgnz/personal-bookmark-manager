import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';
import type { VerifiedIdentity } from '../src/auth/auth.types';
import { OidcTokenVerifier } from '../src/auth/oidc-token-verifier.service';
import { PrismaService } from '../src/database/prisma.service';

const testIssuer = 'https://collections-e2e.local/';
const identities: Record<string, VerifiedIdentity> = {
  'collection-token-a': { issuer: testIssuer, subject: 'collection-user-a' },
  'collection-token-b': { issuer: testIssuer, subject: 'collection-user-b' },
};

interface CollectionBody {
  id: string;
  name: string;
  ownerId: string;
}

describe('collections (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const auth = (token: keyof typeof identities) => `Bearer ${token}`;
  const verify = jest.fn((token: string): Promise<VerifiedIdentity> => {
    const identity = identities[token];
    return identity
      ? Promise.resolve(identity)
      : Promise.reject(new UnauthorizedException('Invalid access token'));
  });

  async function cleanTestData(): Promise<void> {
    const users = await prisma.user.findMany({
      where: { externalIssuer: testIssuer },
      select: { id: true },
    });
    const ownerIds = users.map(({ id }) => id);

    if (ownerIds.length > 0) {
      await prisma.bookmark.deleteMany({
        where: { ownerId: { in: ownerIds } },
      });
      await prisma.collection.deleteMany({
        where: { ownerId: { in: ownerIds } },
      });
    }

    await prisma.user.deleteMany({ where: { externalIssuer: testIssuer } });
  }

  async function createCollection(
    token: keyof typeof identities,
    name: string,
  ): Promise<CollectionBody> {
    const response = await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', auth(token))
      .send({ name })
      .expect(201);
    return response.body as CollectionBody;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OidcTokenVerifier)
      .useValue({ verify })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  beforeEach(cleanTestData);
  afterAll(async () => {
    await cleanTestData();
    await app.close();
  });

  it('requires authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/collections')
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
      message: 'Bearer token required',
    });
  });

  it('creates trimmed collections and permits duplicate names', async () => {
    const first = await createCollection('collection-token-a', '  Reading  ');
    const second = await createCollection('collection-token-a', 'Reading');

    expect(first.name).toBe('Reading');
    expect(second.name).toBe('Reading');
    expect(second.id).not.toBe(first.id);
    expect(second.ownerId).toBe(first.ownerId);
  });

  it('rejects invalid, unknown, and system-managed input safely', async () => {
    const response = await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', auth('collection-token-a'))
      .send({ name: '   ', ownerId: '00000000-0000-4000-8000-000000000000' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
    });
    expect(response.body).not.toHaveProperty('stack');
  });

  it('isolates list data and pagination totals by owner', async () => {
    await createCollection('collection-token-a', 'A1');
    await createCollection('collection-token-a', 'A2');
    await createCollection('collection-token-a', 'A3');
    await createCollection('collection-token-b', 'Private B');

    const response = await request(app.getHttpServer())
      .get('/collections?page=2&limit=2')
      .set('Authorization', auth('collection-token-a'))
      .expect(200);
    const body = response.body as {
      data: CollectionBody[];
      meta: Record<string, number>;
    };

    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.name).not.toBe('Private B');
    expect(body.meta).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it.each([
    '/collections?page=0',
    '/collections?limit=101',
    '/collections?page=one',
    '/collections?unexpected=true',
  ])('rejects invalid pagination query %s', async (path) => {
    await request(app.getHttpServer())
      .get(path)
      .set('Authorization', auth('collection-token-a'))
      .expect(400);
  });

  it('returns indistinguishable 404 responses for missing and cross-owner reads', async () => {
    const privateCollection = await createCollection(
      'collection-token-b',
      'Private B',
    );
    const missingId = '00000000-0000-4000-8000-000000000001';

    const crossOwner = await request(app.getHttpServer())
      .get(`/collections/${privateCollection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .expect(404);
    const missing = await request(app.getHttpServer())
      .get(`/collections/${missingId}`)
      .set('Authorization', auth('collection-token-a'))
      .expect(404);

    expect(crossOwner.body).toEqual(missing.body);
    expect(missing.body).toEqual({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: 'Collection not found',
    });
  });

  it('implements full PUT and explicit-field PATCH semantics', async () => {
    const collection = await createCollection('collection-token-a', 'Original');

    await request(app.getHttpServer())
      .put(`/collections/${collection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .send({})
      .expect(400);

    const replaced = await request(app.getHttpServer())
      .put(`/collections/${collection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .send({ name: ' Replaced ' })
      .expect(200);
    expect((replaced.body as CollectionBody).name).toBe('Replaced');

    await request(app.getHttpServer())
      .patch(`/collections/${collection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/collections/${collection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .send({ name: null })
      .expect(400);

    const patched = await request(app.getHttpServer())
      .patch(`/collections/${collection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .send({ name: 'Patched' })
      .expect(200);
    expect((patched.body as CollectionBody).name).toBe('Patched');
  });

  it('cannot update or delete another owner collection', async () => {
    const privateCollection = await createCollection(
      'collection-token-b',
      'Private B',
    );

    await request(app.getHttpServer())
      .patch(`/collections/${privateCollection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .send({ name: 'Stolen' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/collections/${privateCollection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .expect(404);

    await expect(
      prisma.collection.findUniqueOrThrow({
        where: { id: privateCollection.id },
        select: { name: true },
      }),
    ).resolves.toEqual({ name: 'Private B' });
  });

  it('deletes an owned collection without deleting its bookmarks', async () => {
    const collection = await createCollection(
      'collection-token-a',
      'Disposable',
    );
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        externalIssuer_externalSubject: {
          externalIssuer: testIssuer,
          externalSubject: 'collection-user-a',
        },
      },
    });
    const bookmark = await prisma.bookmark.create({
      data: {
        url: 'https://example.com',
        title: 'Survives',
        ownerId: user.id,
        collectionId: collection.id,
        collectionOwnerId: user.id,
      },
    });

    await request(app.getHttpServer())
      .delete(`/collections/${collection.id}`)
      .set('Authorization', auth('collection-token-a'))
      .expect(204);

    await expect(
      prisma.bookmark.findUniqueOrThrow({ where: { id: bookmark.id } }),
    ).resolves.toMatchObject({
      collectionId: null,
      collectionOwnerId: null,
      ownerId: user.id,
    });
  });
});
