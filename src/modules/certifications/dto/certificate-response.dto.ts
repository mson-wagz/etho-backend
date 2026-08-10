import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CertificationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
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

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-02T00:00:00Z' })
  updatedAt: Date;
}

export type CertificationResponse = CertificationResponseDto;
