import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class UpdateKeywordDto {
  @ApiPropertyOptional({
    description: 'Keyword text',
    example: 'organic',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Filter/Category ID that this keyword belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  filter_id?: string;
}
