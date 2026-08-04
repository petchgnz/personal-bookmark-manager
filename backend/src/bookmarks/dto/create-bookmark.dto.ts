import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from './bookmark-fields';

export class CreateBookmarkDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  url!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @Transform(trimString)
  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsString()
  @MaxLength(10_000)
  notes?: string | null;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsUUID()
  collectionId?: string | null;
}
