import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FilterTier } from '../../../entities/filter.entity';

export class UpdateFilterDto {
  @ApiProperty({ example: 'Organic', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    enum: FilterTier,
    example: FilterTier.PRIMARY,
    required: false,
  })
  @IsOptional()
  @IsEnum(FilterTier)
  tier?: FilterTier;

  @ApiProperty({ example: 'Filter for organic products', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
