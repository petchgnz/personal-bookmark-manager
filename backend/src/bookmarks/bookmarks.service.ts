import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { PaginationQueryDto } from '../collections/dto/pagination-query.dto';
import type { BookmarkQueryDto } from './dto/bookmark-query.dto';
import type { CreateBookmarkDto } from './dto/create-bookmark.dto';
import type { ReplaceBookmarkDto } from './dto/replace-bookmark.dto';
import type { UpdateBookmarkDto } from './dto/update-bookmark.dto';

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

export interface BookmarkRow {
  id: string;
  url: string;
  title: string;
  notes: string | null;
  collectionId: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

function bookmarkNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'RESOURCE_NOT_FOUND',
    message: 'Bookmark not found',
  });
}

function collectionNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'RESOURCE_NOT_FOUND',
    message: 'Collection not found',
  });
}

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBookmarkDto) {
    return this.prisma.$transaction(async (transaction) => {
      await this.requireOwnedCollection(
        transaction,
        ownerId,
        dto.collectionId ?? null,
      );

      return transaction.bookmark.create({
        data: {
          url: dto.url,
          title: dto.title,
          notes: dto.notes ?? null,
          collectionId: dto.collectionId ?? null,
          collectionOwnerId: dto.collectionId ? ownerId : null,
          ownerId,
        },
        select: bookmarkSelect,
      });
    });
  }

  async findAll(ownerId: string, query: BookmarkQueryDto) {
    if (query.search !== undefined) {
      return this.findSearchPage(ownerId, query);
    }

    const where: Prisma.BookmarkWhereInput = {
      ownerId,
      ...(query.collectionId ? { collectionId: query.collectionId } : {}),
      ...(query.uncategorised ? { collectionId: null } : {}),
    };
    return this.findPage(where, query);
  }

  private async findSearchPage(ownerId: string, query: BookmarkQueryDto) {
    const searchDocument = Prisma.sql`
      setweight(to_tsvector('english', COALESCE(b.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(b.notes, '')), 'B')
    `;
    const searchQuery = Prisma.sql`websearch_to_tsquery('english', ${query.search})`;
    const predicates = [
      Prisma.sql`b.owner_id = ${ownerId}::uuid`,
      Prisma.sql`${searchDocument} @@ ${searchQuery}`,
    ];

    if (query.collectionId) {
      predicates.push(
        Prisma.sql`b.collection_id = ${query.collectionId}::uuid`,
      );
    } else if (query.uncategorised) {
      predicates.push(Prisma.sql`b.collection_id IS NULL`);
    }

    const where = Prisma.join(predicates, ' AND ');
    const skip = (query.page - 1) * query.limit;
    const [data, countRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<BookmarkRow[]>(Prisma.sql`
        SELECT
          b.id,
          b.url,
          b.title,
          b.notes,
          b.collection_id AS "collectionId",
          b.owner_id AS "ownerId",
          b.created_at AS "createdAt",
          b.updated_at AS "updatedAt"
        FROM bookmarks b
        WHERE ${where}
        ORDER BY
          ts_rank_cd(${searchDocument}, ${searchQuery}) DESC,
          b.created_at DESC,
          b.id DESC
        OFFSET ${skip}
        LIMIT ${query.limit}
      `),
      this.prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::integer AS total
        FROM bookmarks b
        WHERE ${where}
      `),
    ]);
    const total = countRows[0]?.total ?? 0;

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findByCollection(
    ownerId: string,
    collectionId: string,
    query: PaginationQueryDto,
  ) {
    await this.requireOwnedCollection(this.prisma, ownerId, collectionId);
    return this.findPage({ ownerId, collectionId }, query);
  }

  async findOne(ownerId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, ownerId },
      select: bookmarkSelect,
    });
    if (!bookmark) throw bookmarkNotFound();
    return bookmark;
  }

  async replace(ownerId: string, id: string, dto: ReplaceBookmarkDto) {
    return this.updateOwned(ownerId, id, dto);
  }

  async update(ownerId: string, id: string, dto: UpdateBookmarkDto) {
    return this.updateOwned(ownerId, id, dto);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.prisma.bookmark.deleteMany({
      where: { id, ownerId },
    });
    if (result.count === 0) throw bookmarkNotFound();
  }

  private async findPage(
    where: Prisma.BookmarkWhereInput,
    query: PaginationQueryDto,
  ) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.bookmark.findMany({
        where,
        select: bookmarkSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.bookmark.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private async updateOwned(
    ownerId: string,
    id: string,
    dto: ReplaceBookmarkDto | UpdateBookmarkDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      if (dto.collectionId !== undefined) {
        await this.requireOwnedCollection(
          transaction,
          ownerId,
          dto.collectionId,
        );
      }

      const data: Prisma.BookmarkUpdateManyMutationInput = {
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.collectionId !== undefined
          ? {
              collectionId: dto.collectionId,
              collectionOwnerId: dto.collectionId ? ownerId : null,
            }
          : {}),
      };
      const result = await transaction.bookmark.updateMany({
        where: { id, ownerId },
        data,
      });
      if (result.count === 0) throw bookmarkNotFound();

      return transaction.bookmark.findFirstOrThrow({
        where: { id, ownerId },
        select: bookmarkSelect,
      });
    });
  }

  private async requireOwnedCollection(
    transaction: Pick<PrismaService, 'collection'>,
    ownerId: string,
    collectionId: string | null,
  ): Promise<void> {
    if (collectionId === null) return;
    const collection = await transaction.collection.findFirst({
      where: { id: collectionId, ownerId },
      select: { id: true },
    });
    if (!collection) throw collectionNotFound();
  }
}
