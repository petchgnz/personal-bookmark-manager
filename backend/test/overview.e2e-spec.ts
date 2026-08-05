import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';
import type { VerifiedIdentity } from '../src/auth/auth.types';
import { OidcTokenVerifier } from '../src/auth/oidc-token-verifier.service';
import { PrismaService } from '../src/database/prisma.service';

const testIssuer = 'https://overview-e2e.local/';
const identities: Record<string, VerifiedIdentity> = {
  'overview-token-a': { issuer: testIssuer, subject: 'overview-user-a' },
  'overview-token-b': { issuer: testIssuer, subject: 'overview-user-b' },
};

interface CollectionBody {
  id: string;
  name: string;
}

interface BookmarkBody {
  title: string;
}

interface OverviewBody {
  collections: Array<CollectionBody & { bookmarks: BookmarkBody[] }>;
  uncategorisedBookmarks: BookmarkBody[];
}

describe('overview (e2e)', () => {
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

  async function createBookmark(
    token: keyof typeof identities,
    title: string,
    collectionId: string | null,
  ) {
    return request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', auth(token))
      .send({
        url: `https://example.com/${encodeURIComponent(title)}`,
        title,
        collectionId,
      })
      .expect(201);
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
    await request(app.getHttpServer()).get('/all').expect(401);
  });

  it('groups only the current owner bookmarks and includes empty collections', async () => {
    const collectionA = await createCollection(
      'overview-token-a',
      'A collection',
    );
    await createCollection('overview-token-a', 'A empty');
    const collectionB = await createCollection('overview-token-b', 'Private B');
    await createBookmark('overview-token-a', 'A categorised', collectionA.id);
    await createBookmark('overview-token-a', 'A uncategorised', null);
    await createBookmark(
      'overview-token-b',
      'Private B bookmark',
      collectionB.id,
    );

    const response = await request(app.getHttpServer())
      .get('/all')
      .set('Authorization', auth('overview-token-a'))
      .expect(200);

    const body = response.body as OverviewBody;
    expect(body.collections).toHaveLength(2);
    expect(body.uncategorisedBookmarks).toHaveLength(1);
    expect(body.uncategorisedBookmarks[0]?.title).toBe('A uncategorised');
    expect(body.collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'A collection',
          bookmarks: [expect.objectContaining({ title: 'A categorised' })],
        }),
        expect.objectContaining({ name: 'A empty', bookmarks: [] }),
      ]),
    );
    expect(JSON.stringify(body)).not.toContain('Private B');
  });
});
