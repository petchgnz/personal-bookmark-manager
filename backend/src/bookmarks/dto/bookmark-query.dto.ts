import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../collections/dto/pagination-query.dto';

function strictBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class BookmarkQueryDto extends PaginationQueryDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID()
  collectionId?: string;

  @Transform(strictBoolean)
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  @Equals(true)
  uncategorised?: true;

  @Transform(trimString)
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  search?: string;
}
