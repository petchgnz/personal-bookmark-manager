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

const ids = {
  userA: '10000000-0000-4000-8000-000000000001',
  userB: '10000000-0000-4000-8000-000000000002',
  collectionA: '20000000-0000-4000-8000-000000000001',
  collectionB: '20000000-0000-4000-8000-000000000002',
  bookmarkA: '30000000-0000-4000-8000-000000000001',
  bookmarkB: '30000000-0000-4000-8000-000000000002',
  uncategorisedBookmarkA: '30000000-0000-4000-8000-000000000003',
} as const;

async function seed(): Promise<void> {
  const userA = await prisma.user.upsert({
    where: { id: ids.userA },
    update: {
      externalIssuer: 'https://seed.local/',
      externalSubject: 'user-a',
      email: 'user-a@example.invalid',
      displayName: 'Seed User A',
    },
    create: {
      id: ids.userA,
      externalIssuer: 'https://seed.local/',
      externalSubject: 'user-a',
      email: 'user-a@example.invalid',
      displayName: 'Seed User A',
    },
  });

  const userB = await prisma.user.upsert({
    where: { id: ids.userB },
    update: {
      externalIssuer: 'https://seed.local/',
      externalSubject: 'user-b',
      email: 'user-b@example.invalid',
      displayName: 'Seed User B',
    },
    create: {
      id: ids.userB,
      externalIssuer: 'https://seed.local/',
      externalSubject: 'user-b',
      email: 'user-b@example.invalid',
      displayName: 'Seed User B',
    },
  });

  await prisma.collection.upsert({
    where: { id: ids.collectionA },
    update: { name: 'User A Reading List', ownerId: userA.id },
    create: {
      id: ids.collectionA,
      name: 'User A Reading List',
      ownerId: userA.id,
    },
  });

  await prisma.collection.upsert({
    where: { id: ids.collectionB },
    update: { name: 'User B Reading List', ownerId: userB.id },
    create: {
      id: ids.collectionB,
      name: 'User B Reading List',
      ownerId: userB.id,
    },
  });

  await prisma.bookmark.upsert({
    where: { id: ids.bookmarkA },
    update: {
      url: 'https://example.com/user-a',
      title: 'User A Example',
      notes: 'Private seed bookmark for User A',
      ownerId: userA.id,
      collectionId: ids.collectionA,
      collectionOwnerId: userA.id,
    },
    create: {
      id: ids.bookmarkA,
      url: 'https://example.com/user-a',
      title: 'User A Example',
      notes: 'Private seed bookmark for User A',
      ownerId: userA.id,
      collectionId: ids.collectionA,
      collectionOwnerId: userA.id,
    },
  });

  await prisma.bookmark.upsert({
    where: { id: ids.bookmarkB },
    update: {
      url: 'https://example.com/user-b',
      title: 'User B Example',
      notes: 'Private seed bookmark for User B',
      ownerId: userB.id,
      collectionId: ids.collectionB,
      collectionOwnerId: userB.id,
    },
    create: {
      id: ids.bookmarkB,
      url: 'https://example.com/user-b',
      title: 'User B Example',
      notes: 'Private seed bookmark for User B',
      ownerId: userB.id,
      collectionId: ids.collectionB,
      collectionOwnerId: userB.id,
    },
  });

  await prisma.bookmark.upsert({
    where: { id: ids.uncategorisedBookmarkA },
    update: {
      url: 'https://example.com/user-a-uncategorised',
      title: 'User A Uncategorised Example',
      notes: null,
      ownerId: userA.id,
      collectionId: null,
      collectionOwnerId: null,
    },
    create: {
      id: ids.uncategorisedBookmarkA,
      url: 'https://example.com/user-a-uncategorised',
      title: 'User A Uncategorised Example',
      ownerId: userA.id,
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Database seed failed.');
    await prisma.$disconnect();
    throw error;
  });
