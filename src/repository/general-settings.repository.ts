import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GeneralSettings } from '../entities/general-settings.entity';

@Injectable()
export class GeneralSettingsRepository extends Repository<GeneralSettings> {
  constructor(private dataSource: DataSource) {
    super(GeneralSettings, dataSource.createEntityManager());
  }

  async getSettings(): Promise<GeneralSettings | null> {
    return this.findOne({ where: {} });
  }

  async updateSettings(
    settings: Partial<GeneralSettings>,
  ): Promise<GeneralSettings | null> {
    const existing = await this.getSettings();
    if (existing) {
      await this.update(existing.id, settings);
      return this.findOne({ where: { id: existing.id } });
    }
    // Create if doesn't exist
    const newSettings = this.create(settings);
    return this.save(newSettings);
  }
}
