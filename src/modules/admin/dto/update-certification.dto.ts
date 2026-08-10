import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class UpdateCertificationDto {
  @ApiPropertyOptional({
    description: 'Certification name',
    example: 'GOTS',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter/Category ID that this certification belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  filter_id?: string;

  @ApiPropertyOptional({
    description: 'Certifying body name',
    example: 'Global Organic Textile Standard',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  certifying_body?: string;

  @ApiPropertyOptional({
    description: 'Certification description',
    example:
      'Global Organic Textile Standard certification for organic textiles',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
