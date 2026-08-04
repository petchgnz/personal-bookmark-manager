import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsUUID, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../collections/dto/pagination-query.dto';

function strictBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
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
}
