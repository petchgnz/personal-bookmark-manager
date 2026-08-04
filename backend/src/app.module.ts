import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [DatabaseModule, AuthModule, CollectionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
