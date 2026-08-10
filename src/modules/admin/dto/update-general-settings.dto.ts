import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { PeriodUnit } from '../../../entities/general-settings.entity';

export class UpdateGeneralSettingsDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  scraping_frequency: number;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  scraping_frequency_period_value: number;

  @ApiProperty({ enum: PeriodUnit, example: PeriodUnit.DAYS })
  @IsEnum(PeriodUnit)
  scraping_frequency_period_unit: PeriodUnit;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  discovery_max_queries: number;
}
