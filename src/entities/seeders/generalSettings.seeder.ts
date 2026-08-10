import { Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { GeneralSettingsRepository } from '../../repository/general-settings.repository';
import { PeriodUnit } from '../general-settings.entity';

@Injectable()
export class GeneralSettingsSeeder implements Seeder {
  constructor(
    private readonly generalSettingsRepository: GeneralSettingsRepository,
  ) {}

  async seed(): Promise<any> {
    const existing = await this.generalSettingsRepository.getSettings();
    if (existing) {
      return;
    }

    await this.generalSettingsRepository.updateSettings({
      scraping_frequency: 0,
      scraping_frequency_period_value: 1,
      scraping_frequency_period_unit: PeriodUnit.DAYS,
      discovery_max_queries: 10,
    });
  }

  async drop(): Promise<any> {
    await this.generalSettingsRepository.delete({});
  }
}
