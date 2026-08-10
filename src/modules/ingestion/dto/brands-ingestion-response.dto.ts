import { ApiProperty } from '@nestjs/swagger';

export class BrandIngestionLogDto {
  @ApiProperty()
  brand_id: string;

  @ApiProperty()
  source_name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  products_ingested: number;

  @ApiProperty()
  products_excluded: number;

  @ApiProperty()
  products_updated: number;

  @ApiProperty()
  last_run: Date;

  @ApiProperty()
  errors: string | null;
}

export class BrandsIngestionResponseDto {
  @ApiProperty({ type: [BrandIngestionLogDto] })
  logs: BrandIngestionLogDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
