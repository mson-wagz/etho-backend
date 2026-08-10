import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductAvailability } from '../../../common/enums/product.enum';

export class UpdateProductVariantDto {
  @ApiPropertyOptional({
    description: 'Variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Price',
    example: 29.99,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Currency',
    example: 'USD',
    maxLength: 3,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Compare at price',
    example: 39.99,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  compare_at_price?: number;

  @ApiPropertyOptional({
    description: 'Availability',
    enum: ProductAvailability,
    example: ProductAvailability.IN_STOCK,
  })
  @IsEnum(ProductAvailability)
  @IsOptional()
  availability?: ProductAvailability;
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Organic Cotton T-Shirt',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  name?: string;

  @ApiPropertyOptional({
    description: 'Product description (supports markdown)',
    example:
      'A comfortable organic cotton t-shirt made from 100% GOTS certified organic cotton.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Product source URL',
    example: 'https://example.com/products/organic-tshirt',
  })
  @IsString()
  @IsOptional()
  source_url?: string;

  @ApiPropertyOptional({
    description: 'Product variants to update',
    type: [UpdateProductVariantDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];

  @ApiPropertyOptional({
    description: 'Filter/Badge IDs (ethics tags)',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  filter_ids?: string[];

  @ApiPropertyOptional({
    description: 'Certification IDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  certification_ids?: string[];
}
