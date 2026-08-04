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
import { CurrentUserIdentity } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/auth.types';
import { CollectionsService } from './collections.service';
import { CollectionNameDto } from './dto/collection-name.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(
    @CurrentUserIdentity() user: CurrentUser,
    @Body() dto: CollectionNameDto,
  ) {
    return this.collectionsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUserIdentity() user: CurrentUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.collectionsService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.collectionsService.findOne(user.id, id);
  }

  @Put(':id')
  replace(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CollectionNameDto,
  ) {
    return this.collectionsService.replace(user.id, id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    if (dto.name === undefined) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ field: 'name', issue: 'name must be provided' }],
      });
    }

    return this.collectionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUserIdentity() user: CurrentUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.collectionsService.remove(user.id, id);
  }
}
