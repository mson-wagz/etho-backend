import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCertificationResponseDto {
  @ApiProperty({
    description: 'Certification ID',
    example: 'cert-123',
  })
  id: string;

  @ApiProperty({
    description: 'Certification name',
    example: 'Fair Trade',
  })
  name: string;

  @ApiProperty({
    description: 'Certification slug',
    example: 'gots',
  })
  slug: string;

  @ApiProperty({
    description: 'Filter/Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  filter_id: string;

  @ApiPropertyOptional({
    description: 'Filter/Category name',
    example: 'Fair Trade Practices',
  })
  filter_name?: string;

  @ApiProperty({
    description: 'Certifying body name',
    example: 'Fair Trade USA',
  })
  certifying_body: string;

  @ApiPropertyOptional({
    description: 'Certification description',
    example: 'Products that meet fair trade standards',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon URL for the certification',
    example: 'https://example.com/fairtrade-icon.png',
  })
  icon_url?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updated_at: Date;
}
