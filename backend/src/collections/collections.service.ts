import { Injectable, NotFoundException } from '@nestjs/common';
import type { CollectionNameDto } from './dto/collection-name.dto';
import type { CollectionQueryDto } from './dto/collection-query.dto';
import type { UpdateCollectionDto } from './dto/update-collection.dto';
import { PrismaService } from '../database/prisma.service';

const collectionSelect = {
  id: true,
  name: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

function collectionNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'RESOURCE_NOT_FOUND',
    message: 'Collection not found',
  });
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CollectionNameDto) {
    return this.prisma.collection.create({
      data: { name: dto.name, ownerId },
      select: collectionSelect,
    });
  }

  async findAll(ownerId: string, query: CollectionQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where = {
      ownerId,
      ...(query.name
        ? { name: { contains: query.name, mode: 'insensitive' as const } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.collection.findMany({
        where,
        select: collectionSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.collection.count({ where }),
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

  async findOne(ownerId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, ownerId },
      select: collectionSelect,
    });

    if (!collection) {
      throw collectionNotFound();
    }

    return collection;
  }

  async replace(ownerId: string, id: string, dto: CollectionNameDto) {
    return this.updateOwned(ownerId, id, dto);
  }

  async update(ownerId: string, id: string, dto: UpdateCollectionDto) {
    return this.updateOwned(ownerId, id, dto);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.prisma.collection.deleteMany({
      where: { id, ownerId },
    });

    if (result.count === 0) {
      throw collectionNotFound();
    }
  }

  private async updateOwned(
    ownerId: string,
    id: string,
    dto: CollectionNameDto | UpdateCollectionDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.collection.updateMany({
        where: { id, ownerId },
        data: dto,
      });

      if (result.count === 0) {
        throw collectionNotFound();
      }

      return transaction.collection.findFirstOrThrow({
        where: { id, ownerId },
        select: collectionSelect,
      });
    });
  }
}
