import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryDto {
  @ApiProperty({ example: 'cat-001' })
  id: string;

  @ApiProperty({ example: 'Clothing' })
  name: string;

  @ApiProperty({ example: 'clothing' })
  slug: string;

  @ApiPropertyOptional({ example: 'shirt-icon' })
  icon?: string;
}

export class ProductVariantDto {
  @ApiProperty({ example: 'var-001' })
  id: string;

  @ApiProperty({ type: [String], example: ['https://example.com/variant.jpg'] })
  images: string[];

  @ApiProperty({ example: 29.99 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiPropertyOptional({ example: '$' })
  currency_symbol?: string;

  @ApiPropertyOptional({ example: 39.99 })
  compare_at_price?: number;

  @ApiProperty({ example: 'in_stock' })
  availability: string;

  @ApiPropertyOptional({ example: 'https://seller.com/product/variant' })
  source_url?: string;
}

export class ProductCertificationDto {
  @ApiProperty({ example: 'cert-001' })
  id: string;

  @ApiProperty({ example: 'GOTS' })
  name: string;

  @ApiProperty({ example: 'gots' })
  slug: string;

  @ApiProperty({ example: 'Global Organic Textile Standard' })
  certifying_body: string;

  @ApiPropertyOptional({
    example: 'Global Organic Textile Standard certification',
  })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png' })
  icon_url?: string;

  @ApiPropertyOptional({ example: 'https://global-standard.org' })
  website_url?: string;

  @ApiPropertyOptional({ example: 'https://global-standard.org/verify/12345' })
  verification_url?: string;
}

export class ProductBrandDto {
  @ApiProperty({ example: 'brand-001' })
  id: string;

  @ApiProperty({ example: 'EcoWear' })
  name: string;

  @ApiProperty({ example: 'https://ecowear.com' })
  website_url: string;

  @ApiPropertyOptional({ example: 'Sustainable fashion brand' })
  description?: string;
}

export class ProductMetadataDto {
  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2023-01-02T00:00:00Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: 'manual' })
  extraction_method?: string;

  @ApiPropertyOptional({ example: '0.95' })
  extraction_confidence?: string;
}

export class ProductDetailResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Organic Cotton T-Shirt' })
  name: string;

  @ApiProperty({ example: 'organic-cotton-tshirt' })
  slug: string;

  @ApiPropertyOptional({
    example: 'Eco-friendly cotton t-shirt made from organic cotton',
  })
  description?: string;

  @ApiProperty({ type: ProductCategoryDto })
  category: ProductCategoryDto;

  @ApiPropertyOptional({ type: [String], example: ['cotton', 'organic'] })
  materials?: string[];

  @ApiPropertyOptional({ example: 'InStock' })
  availability?: string;

  @ApiPropertyOptional({ example: 'ECO-TEE-001' })
  sku?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['organic', 'cotton', 'sustainable'],
  })
  tags?: string[];

  @ApiPropertyOptional({ example: 4.5 })
  rating?: number;

  @ApiPropertyOptional({ example: 28 })
  reviews_count?: number;

  @ApiProperty({ type: Object })
  variants: {
    [key: string]: ProductVariantDto[];
  };

  @ApiProperty({ type: [ProductCertificationDto] })
  certifications: ProductCertificationDto[];

  @ApiPropertyOptional({ type: [Object] })
  badges?: any[];

  @ApiProperty({ type: ProductBrandDto })
  brand: ProductBrandDto;

  @ApiPropertyOptional({ example: 'https://ecowear.com/organic-tshirt' })
  sourceUrl?: string;
}
