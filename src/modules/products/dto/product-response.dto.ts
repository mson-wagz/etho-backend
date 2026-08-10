import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Organic Cotton T-Shirt' })
  name: string;

  @ApiPropertyOptional({ example: 'Eco-friendly cotton t-shirt' })
  description?: string;

  @ApiProperty({
    example: { id: 'cat-001', name: 'Clothing', slug: 'clothing' },
  })
  category: { id: string; name: string; slug: string };

  @ApiPropertyOptional({ type: [String], example: ['cotton', 'organic'] })
  materials?: string[];

  @ApiProperty({ example: [] })
  badges: any[];

  @ApiProperty({ example: Object })
  brand: any;

  @ApiProperty({ type: Object, example: {} })
  variants: any;

  @ApiProperty({ example: 'organic-cotton-tshirt' })
  slug: string;

  @ApiProperty({
    example: 'https://seller-website.com/product/organic-cotton-tshirt',
  })
  sourceUrl: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-02T00:00:00Z' })
  updatedAt: Date;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export type ProductResponse = ProductResponseDto;
export type ProductListResponse = ProductListResponseDto;
