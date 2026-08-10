import { ApiProperty } from '@nestjs/swagger';

export class ProductsIngestedStatsDto {
  @ApiProperty({ description: 'Total products ingested across all time' })
  total: number;

  @ApiProperty({ description: 'Products ingested today' })
  today: number;

  @ApiProperty({ description: 'Percentage change from yesterday' })
  change_percentage: number;
}

export class IngestionStatsResponseDto {
  @ApiProperty({ description: 'Total number of connected sources' })
  total_sources: number;

  @ApiProperty({ type: ProductsIngestedStatsDto })
  products_ingested: ProductsIngestedStatsDto;

  @ApiProperty({
    description: 'Number of failed ingestions requiring attention',
  })
  failed_ingestions: number;

  @ApiProperty({ description: 'Total products excluded by filters' })
  products_excluded: number;
}
