import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';
import type { VerifiedIdentity } from '../src/auth/auth.types';
import { OidcTokenVerifier } from '../src/auth/oidc-token-verifier.service';
import { PrismaService } from '../src/database/prisma.service';

const testIssuer = 'https://bookmarks-e2e.local/';
const identities: Record<string, VerifiedIdentity> = {
  'bookmark-token-a': { issuer: testIssuer, subject: 'bookmark-user-a' },
  'bookmark-token-b': { issuer: testIssuer, subject: 'bookmark-user-b' },
};
type TestToken = keyof typeof identities;

interface CollectionBody {
  id: string;
}

interface BookmarkBody {
  id: string;
  url: string;
  title: string;
  notes: string | null;
  collectionId: string | null;
  ownerId: string;
}

describe('bookmarks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const auth = (token: TestToken) => `Bearer ${token}`;
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

  async function createCollection(token: TestToken, name: string) {
    const response = await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', auth(token))
      .send({ name })
      .expect(201);
    return response.body as CollectionBody;
  }

  async function createBookmark(
    token: TestToken,
    overrides: Partial<{
      url: string;
      title: string;
      notes: string | null;
      collectionId: string | null;
    }> = {},
  ) {
    const response = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', auth(token))
      .send({
        url: 'https://example.com',
        title: 'Example',
        ...overrides,
      })
      .expect(201);
    return response.body as BookmarkBody;
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

  it('requires authentication and rejects unsafe or unknown input', async () => {
    await request(app.getHttpServer()).get('/bookmarks').expect(401);

    const response = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', auth('bookmark-token-a'))
      .send({
        url: 'javascript:alert(1)',
        title: 'Unsafe',
        ownerId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('creates trimmed uncategorised and categorised bookmarks', async () => {
    const collection = await createCollection('bookmark-token-a', 'Work');
    const uncategorised = await createBookmark('bookmark-token-a', {
      url: ' https://example.com/path ',
      title: ' Example title ',
    });
    const categorised = await createBookmark('bookmark-token-a', {
      title: 'In collection',
      notes: ' notes ',
      collectionId: collection.id,
    });

    expect(uncategorised).toMatchObject({
      url: 'https://example.com/path',
      title: 'Example title',
      notes: null,
      collectionId: null,
    });
    expect(categorised).toMatchObject({
      notes: 'notes',
      collectionId: collection.id,
    });
    expect(categorised).not.toHaveProperty('collectionOwnerId');
  });

  it('returns identical 404 when a relation is missing or owned by another user', async () => {
    const privateCollection = await createCollection(
      'bookmark-token-b',
      'Private',
    );
    const missingId = '00000000-0000-4000-8000-000000000001';

    const crossOwner = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', auth('bookmark-token-a'))
      .send({
        url: 'https://example.com',
        title: 'Blocked',
        collectionId: privateCollection.id,
      })
      .expect(404);
    const missing = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', auth('bookmark-token-a'))
      .send({
        url: 'https://example.com',
        title: 'Blocked',
        collectionId: missingId,
      })
      .expect(404);

    expect(crossOwner.body).toEqual(missing.body);
    expect(missing.body).toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
      message: 'Collection not found',
    });
  });

  it('isolates bookmark lists, filters, and totals by owner', async () => {
    const collection = await createCollection('bookmark-token-a', 'A');
    await createBookmark('bookmark-token-a', { title: 'A uncategorised' });
    await createBookmark('bookmark-token-a', {
      title: 'A categorised',
      collectionId: collection.id,
    });
    await createBookmark('bookmark-token-b', { title: 'Private B' });

    const all = await request(app.getHttpServer())
      .get('/bookmarks')
      .set('Authorization', auth('bookmark-token-a'))
      .expect(200);
    expect(all.body).toMatchObject({ meta: { total: 2 } });

    const categorised = await request(app.getHttpServer())
      .get(`/bookmarks?collectionId=${collection.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(200);
    expect(categorised.body).toMatchObject({ meta: { total: 1 } });
    expect((categorised.body as { data: BookmarkBody[] }).data[0]?.title).toBe(
      'A categorised',
    );

    const uncategorised = await request(app.getHttpServer())
      .get('/bookmarks?uncategorised=true')
      .set('Authorization', auth('bookmark-token-a'))
      .expect(200);
    expect(uncategorised.body).toMatchObject({ meta: { total: 1 } });
    expect(
      (uncategorised.body as { data: BookmarkBody[] }).data[0]?.title,
    ).toBe('A uncategorised');
  });

  it('rejects conflicting, false, and unknown filters', async () => {
    const collection = await createCollection('bookmark-token-a', 'A');
    for (const path of [
      `/bookmarks?collectionId=${collection.id}&uncategorised=true`,
      '/bookmarks?uncategorised=false',
      '/bookmarks?search=private',
    ]) {
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', auth('bookmark-token-a'))
        .expect(400);
    }
  });

  it('protects single reads and mutations with indistinguishable 404 responses', async () => {
    const privateBookmark = await createBookmark('bookmark-token-b', {
      title: 'Private B',
    });
    const missingId = '00000000-0000-4000-8000-000000000002';
    const cross = await request(app.getHttpServer())
      .get(`/bookmarks/${privateBookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(404);
    const missing = await request(app.getHttpServer())
      .get(`/bookmarks/${missingId}`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(404);
    expect(cross.body).toEqual(missing.body);

    await request(app.getHttpServer())
      .patch(`/bookmarks/${privateBookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .send({ title: 'Stolen' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/bookmarks/${privateBookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(404);
    await expect(
      prisma.bookmark.findUniqueOrThrow({ where: { id: privateBookmark.id } }),
    ).resolves.toMatchObject({ title: 'Private B' });
  });

  it('implements full PUT and nullable PATCH semantics', async () => {
    const firstCollection = await createCollection('bookmark-token-a', 'First');
    const secondCollection = await createCollection(
      'bookmark-token-a',
      'Second',
    );
    const bookmark = await createBookmark('bookmark-token-a', {
      notes: 'Original notes',
      collectionId: firstCollection.id,
    });

    await request(app.getHttpServer())
      .put(`/bookmarks/${bookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .send({
        url: 'https://replacement.test',
        title: 'Missing nullable fields',
      })
      .expect(400);

    const replaced = await request(app.getHttpServer())
      .put(`/bookmarks/${bookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .send({
        url: 'https://replacement.test',
        title: 'Replaced',
        notes: null,
        collectionId: secondCollection.id,
      })
      .expect(200);
    expect(replaced.body).toMatchObject({
      notes: null,
      collectionId: secondCollection.id,
    });

    await request(app.getHttpServer())
      .patch(`/bookmarks/${bookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .send({})
      .expect(400);
    const patched = await request(app.getHttpServer())
      .patch(`/bookmarks/${bookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .send({ title: 'Patched', notes: null, collectionId: null })
      .expect(200);
    expect(patched.body).toMatchObject({
      title: 'Patched',
      notes: null,
      collectionId: null,
    });
  });

  it('authorizes the collection and scopes nested rows and pagination', async () => {
    const empty = await createCollection('bookmark-token-a', 'Empty');
    const populated = await createCollection('bookmark-token-a', 'Populated');
    const privateCollection = await createCollection(
      'bookmark-token-b',
      'Private',
    );
    await createBookmark('bookmark-token-a', { collectionId: populated.id });
    await createBookmark('bookmark-token-b', {
      collectionId: privateCollection.id,
    });

    const emptyResponse = await request(app.getHttpServer())
      .get(`/collections/${empty.id}/bookmarks`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(200);
    expect(emptyResponse.body).toMatchObject({ data: [], meta: { total: 0 } });

    const nested = await request(app.getHttpServer())
      .get(`/collections/${populated.id}/bookmarks`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(200);
    expect(nested.body).toMatchObject({ meta: { total: 1 } });

    const cross = await request(app.getHttpServer())
      .get(`/collections/${privateCollection.id}/bookmarks`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(404);
    const missing = await request(app.getHttpServer())
      .get('/collections/00000000-0000-4000-8000-000000000003/bookmarks')
      .set('Authorization', auth('bookmark-token-a'))
      .expect(404);
    expect(cross.body).toEqual(missing.body);
  });

  it('deletes only an owned bookmark', async () => {
    const bookmark = await createBookmark('bookmark-token-a');
    await request(app.getHttpServer())
      .delete(`/bookmarks/${bookmark.id}`)
      .set('Authorization', auth('bookmark-token-a'))
      .expect(204);
    await expect(
      prisma.bookmark.findUnique({ where: { id: bookmark.id } }),
    ).resolves.toBeNull();
  });
});
