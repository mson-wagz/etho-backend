import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FilterTier } from '../../../entities/filter.entity';

export class CreateFilterDto {
  @ApiProperty({ example: 'Organic' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: FilterTier, example: FilterTier.PRIMARY })
  @IsEnum(FilterTier)
  tier: FilterTier;

  @ApiProperty({ example: 'Filter for organic products' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
