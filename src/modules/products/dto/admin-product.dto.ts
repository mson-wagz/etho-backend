import { ApiProperty } from '@nestjs/swagger';

export class ProductStatsDto {
  @ApiProperty({
    description: 'Total products statistics',
    type: () => ({
      value: { type: 'number' },
      ingestion_trend_pcnt: { type: 'number' },
      trend: { type: 'object' },
    }),
  })
  total_products: {
    value: number;
    ingestion_trend_pcnt: number;
    trend: { value: number; period: string };
  };

  @ApiProperty({
    description: 'In stock products statistics',
    type: () => ({
      value: { type: 'number' },
      in_stock_trend_pcnt: { type: 'number' },
      trend: { type: 'object' },
    }),
  })
  in_stock: {
    value: number;
    in_stock_trend_pcnt: number;
    trend: { value: number; period: string };
  };

  @ApiProperty({
    description: 'Out of stock products',
    type: () => ({
      value: { type: 'number' },
    }),
  })
  out_of_stock: {
    value: number;
  };

  @ApiProperty({
    description: 'Products added to cart',
    type: () => ({
      value: { type: 'number' },
    }),
  })
  in_cart_adds: {
    value: number;
  };
}
