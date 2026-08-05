import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { CurrentUser } from '../auth/auth.types';
import { CurrentUserIdentity } from '../auth/current-user.decorator';
import { PaginationQueryDto } from '../collections/dto/pagination-query.dto';
import { BookmarksService } from './bookmarks.service';
import { BookmarkQueryDto } from './dto/bookmark-query.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { ReplaceBookmarkDto } from './dto/replace-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(
    @CurrentUserIdentity() user: CurrentUser,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarksService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUserIdentity() user: CurrentUser,
    @Query() query: BookmarkQueryDto,
  ) {
    if (query.collectionId && query.uncategorised) {
      throw new BadRequestException({
        code: 'INVALID_QUERY',
        message: 'collectionId and uncategorised cannot be combined',
      });
    }
    return this.bookmarksService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bookmarksService.findOne(user.id, id);
  }

  @Put(':id')
  replace(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplaceBookmarkDto,
  ) {
    return this.bookmarksService.replace(user.id, id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookmarkDto,
  ) {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ field: 'body', issue: 'at least one field is required' }],
      });
    }
    return this.bookmarksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.bookmarksService.remove(user.id, id);
  }
}

@Controller('collections/:collectionId/bookmarks')
export class CollectionBookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('collectionId', new ParseUUIDPipe()) collectionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bookmarksService.findByCollection(user.id, collectionId, query);
  }
}
