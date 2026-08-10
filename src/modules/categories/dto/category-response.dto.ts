import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Clothing' })
  name: string;

  @ApiProperty({ example: 'clothing' })
  slug: string;

  @ApiProperty({ example: [String] })
  path: string[];

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  parentId?: string;

  @ApiPropertyOptional({ type: CategoryResponseDto })
  children?: CategoryResponseDto[];
}

export class CategoriesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [CategoryResponseDto] })
  data: CategoryResponseDto[];
}

export type CategoryResponse = CategoryResponseDto;
