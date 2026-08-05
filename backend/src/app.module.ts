import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CollectionsModule } from './collections/collections.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { OverviewModule } from './overview/overview.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CollectionsModule,
    BookmarksModule,
    OverviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
