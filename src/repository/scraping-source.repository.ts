import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ScrapingSource } from '../entities/scraping-source.entity';

@Injectable()
export class ScrapingSourceRepository extends Repository<ScrapingSource> {
  constructor(private dataSource: DataSource) {
    super(ScrapingSource, dataSource.createEntityManager());
  }

  async findByBrandId(brandId: string): Promise<ScrapingSource[]> {
    return this.find({ where: { brand_id: brandId } });
  }

  async findActive(): Promise<ScrapingSource[]> {
    return this.find({ where: { is_active: true } });
  }
}
