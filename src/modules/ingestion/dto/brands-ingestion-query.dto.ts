import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../products/dto/pagination.dto';
import { IngestionStatus } from '../../../common/enums/ingestion.enum';

export enum SortBy {
  LAST_RUN = 'lastRun',
  SOURCE_NAME = 'sourceName',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class BrandsIngestionQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: IngestionStatus,
    description: 'Filter by ingestion status',
  })
  @IsOptional()
  @IsEnum(IngestionStatus)
  status?: IngestionStatus;

  @ApiProperty({
    description: 'Current page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page for pagination',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Search by source name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: SortBy,
    default: SortBy.LAST_RUN,
    description: 'Sort by field',
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.LAST_RUN;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
