import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SourceHistory } from '../entities/source-history.entity';

@Injectable()
export class SourceHistoryRepository extends Repository<SourceHistory> {
  constructor(private dataSource: DataSource) {
    super(SourceHistory, dataSource.createEntityManager());
  }

  async createEntry(data: Partial<SourceHistory>): Promise<SourceHistory> {
    const entry = this.create(data);
    return this.save(entry);
  }

  async findByNameOrUrl(
    name: string,
    websiteUrl?: string,
  ): Promise<SourceHistory | null> {
    if (websiteUrl) {
      return this.findOne({ where: [{ name }, { website_url: websiteUrl }] });
    }
    return this.findOne({ where: { name } });
  }

  async findAll(): Promise<SourceHistory[]> {
    return this.find({ order: { added_at: 'DESC' } });
  }
}
