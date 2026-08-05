import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const localDatabaseUrl =
  'postgresql://bookmark_app:bookmark_app_password@localhost:5433/personal_bookmark_manager';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? localDatabaseUrl,
  }),
});

const testIds = {
  userA: 'a0000000-0000-4000-8000-000000000001',
  userB: 'a0000000-0000-4000-8000-000000000002',
  collectionA: 'b0000000-0000-4000-8000-000000000001',
  bookmarkA: 'c0000000-0000-4000-8000-000000000001',
} as const;

async function cleanTestRecords(): Promise<void> {
  await prisma.bookmark.deleteMany({
    where: { id: { in: [testIds.bookmarkA] } },
  });
  await prisma.collection.deleteMany({
    where: { id: { in: [testIds.collectionA] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [testIds.userA, testIds.userB] } },
  });
}

describe('database invariants', () => {
  beforeEach(async () => {
    await cleanTestRecords();
    await prisma.user.createMany({
      data: [
        {
          id: testIds.userA,
          externalIssuer: 'https://database-test.local/',
          externalSubject: 'user-a',
        },
        {
          id: testIds.userB,
          externalIssuer: 'https://database-test.local/',
          externalSubject: 'user-b',
        },
      ],
    });
  });

  afterEach(cleanTestRecords);

  afterAll(async () => {
    await cleanTestRecords();
    await prisma.$disconnect();
  });

  it('keeps an external identity unique within its issuer', async () => {
    await expect(
      prisma.user.create({
        data: {
          externalIssuer: 'https://database-test.local/',
          externalSubject: 'user-a',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('uncategorises bookmarks without changing their owner when a collection is deleted', async () => {
    await prisma.collection.create({
      data: {
        id: testIds.collectionA,
        name: 'User A Collection',
        ownerId: testIds.userA,
      },
    });
    await prisma.bookmark.create({
      data: {
        id: testIds.bookmarkA,
        url: 'https://example.com/database-test',
        title: 'Database Test',
        ownerId: testIds.userA,
        collectionId: testIds.collectionA,
        collectionOwnerId: testIds.userA,
      },
    });

    await prisma.collection.delete({ where: { id: testIds.collectionA } });

    await expect(
      prisma.bookmark.findUniqueOrThrow({ where: { id: testIds.bookmarkA } }),
    ).resolves.toMatchObject({
      ownerId: testIds.userA,
      collectionId: null,
      collectionOwnerId: null,
    });
  });

  it("rejects a bookmark relation to another user's collection", async () => {
    await prisma.collection.create({
      data: {
        id: testIds.collectionA,
        name: 'User A Collection',
        ownerId: testIds.userA,
      },
    });

    await expect(
      prisma.bookmark.create({
        data: {
          id: testIds.bookmarkA,
          url: 'https://example.com/cross-owner-database-test',
          title: 'Cross-owner Database Test',
          ownerId: testIds.userB,
          collectionId: testIds.collectionA,
          collectionOwnerId: testIds.userA,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2039' });
  });

  it('has the weighted GIN full-text search index', async () => {
    const indexes = await prisma.$queryRaw<
      Array<{ indexdef: string }>
    >`SELECT indexdef FROM pg_indexes WHERE indexname = 'bookmarks_search_vector_idx'`;

    expect(indexes).toHaveLength(1);
    expect(indexes[0]?.indexdef).toContain('USING gin');
    expect(indexes[0]?.indexdef).toContain("to_tsvector('english'::regconfig");
    expect(indexes[0]?.indexdef).toContain('\'A\'::"char"');
    expect(indexes[0]?.indexdef).toContain('\'B\'::"char"');
  });
});
