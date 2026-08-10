import {
  IsString,
  IsUUID,
  IsOptional,
  IsObject,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnalyticsEventDto {
  @ApiProperty({
    description: 'Type of the analytics event',
    example: 'page_view',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  event_type: string;

  // purposedly not documented or validated as it will be set from session/cookie
  session_id?: string;

  @ApiPropertyOptional({
    description: 'Product ID if event is product-related',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the event',
    example: { page: '/products', referrer: 'google.com' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AnalyticsEventResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      event_id: '123e4567-e89b-12d3-a456-426614174000',
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      created_at: '2023-01-01T00:00:00Z',
    },
  })
  data: {
    event_id: string;
    session_id: string;
    created_at: Date;
  };
}

export { CreateAnalyticsEventDto as CreateAnalyticsEvent };

export class BaseGetAnalyticsDto {
  @ApiProperty({
    description: 'Start date for the analytics data (ISO 8601 format)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date for the analytics data (ISO 8601 format)',
    example: '2023-01-07T23:59:59Z',
  })
  @IsString()
  @IsNotEmpty()
  endDate: string;
}

export class GetProductPerformanceDto extends BaseGetAnalyticsDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class AnalyticsStatsDto {
  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'Start date of the period',
  })
  period_start: string;

  @ApiProperty({
    example: '2023-01-07T23:59:59Z',
    description: 'End date of the period',
  })
  period_end: string;

  @ApiProperty({ example: 1000, description: 'Total products displayed' })
  total_products_displayed: number;

  @ApiProperty({
    example: {
      count: 200,
      trend_percentage: 10,
      trend: { value: 7, period: 'days' },
    },
    description: 'Products ingested in the last 7 days with trend percentage',
  })
  products_ingested: {
    count: number;
    trend_percentage: number;
    trend: { value: number; period: string };
  };

  @ApiProperty({
    example: {
      rate: 5.5,
      trend_percentage: -2,
      trend: { value: 7, period: 'days' },
    },
    description: 'Click through rate in the last 7 days with trend percentage',
  })
  click_through_rate: {
    rate: number;
    trend_percentage: number;
    trend: { value: number; period: string };
  };

  @ApiProperty({
    example: 300,
    description: 'Redirects to partner sites last 7 days',
  })
  total_redirects: number;
}

export class ProductPerformanceDto {
  @ApiProperty({
    example: 'Sample Product',
    description: 'Name of the product',
  })
  product_name: string;

  @ApiProperty({ example: 'Sample Brand', description: 'Name of the brand' })
  brand_name: string;

  @ApiProperty({ example: 150, description: 'Number of product views' })
  product_views: number;

  @ApiProperty({
    example: 30,
    description: 'Number of times product was added to cart',
  })
  product_cart_adds: number;

  @ApiProperty({
    example: 20,
    description: 'Number of redirects to partner site',
  })
  product_redirects: number;

  @ApiProperty({ example: 13.33, description: 'Click through rate percentage' })
  product_ctr: number;
}

export class ProductPerformanceResponseDto {
  @ApiProperty({ type: [ProductPerformanceDto] })
  data: ProductPerformanceDto[];

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;
}
