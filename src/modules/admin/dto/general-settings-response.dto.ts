import { ApiProperty } from '@nestjs/swagger';
import { PeriodUnit } from '../../../entities/general-settings.entity';

export class GeneralSettingsResponseDto {
  @ApiProperty({ example: 1 })
  scraping_frequency: number;

  @ApiProperty({ example: 3 })
  scraping_frequency_period_value: number;

  @ApiProperty({ enum: PeriodUnit, example: PeriodUnit.DAYS })
  scraping_frequency_period_unit: PeriodUnit;

  @ApiProperty({ example: 10 })
  discovery_max_queries: number;
}
