import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export enum DeleteBrandMode {
  PRODUCTS_ONLY = 'products_only',
  PRODUCTS_AND_BRAND = 'products_and_brand',
}

export class DeleteBrandDto {
  @ApiProperty({
    description: 'The UUID of the brand to delete',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Deletion mode: "products_only" or "products_and_brand"',
    example: 'products_only',
    required: false,
  })
  @IsOptional()
  mode?: DeleteBrandMode;
}
