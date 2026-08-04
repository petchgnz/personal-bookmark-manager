import { Module } from '@nestjs/common';
import {
  BookmarksController,
  CollectionBookmarksController,
} from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  controllers: [BookmarksController, CollectionBookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
