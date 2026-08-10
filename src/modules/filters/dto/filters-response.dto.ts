import { ApiProperty } from '@nestjs/swagger';

export class FiltersResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Organic' })
  name: string;

  @ApiProperty({ example: 'organic' })
  slug: string;

  @ApiProperty({
    enum: ['primary', 'secondary', 'tertiary'],
    example: 'primary',
  })
  tier: string;

  @ApiProperty({ example: 'Filter for organic products' })
  description: string;

  @ApiProperty({ example: 'organic, natural, eco' })
  keywords: string[];

  @ApiProperty({ example: 0 })
  priority: number;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-02T00:00:00Z' })
  updatedAt: Date;
}

export { FiltersResponseDto as FiltersResponse };
