import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const collectionSelect = {
  id: true,
  name: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const bookmarkSelect = {
  id: true,
  url: true,
  title: true,
  notes: true,
  collectionId: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string) {
    const [collections, bookmarks] = await this.prisma.$transaction([
      this.prisma.collection.findMany({
        where: { ownerId },
        select: collectionSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.bookmark.findMany({
        where: { ownerId },
        select: bookmarkSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);

    const bookmarksByCollection = new Map<string, typeof bookmarks>();
    const uncategorisedBookmarks: typeof bookmarks = [];

    for (const bookmark of bookmarks) {
      if (bookmark.collectionId === null) {
        uncategorisedBookmarks.push(bookmark);
        continue;
      }

      const grouped = bookmarksByCollection.get(bookmark.collectionId) ?? [];
      grouped.push(bookmark);
      bookmarksByCollection.set(bookmark.collectionId, grouped);
    }

    return {
      collections: collections.map((collection) => ({
        ...collection,
        bookmarks: bookmarksByCollection.get(collection.id) ?? [],
      })),
      uncategorisedBookmarks,
    };
  }
}
