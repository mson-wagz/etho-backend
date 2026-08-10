import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Meta } from '../entities/meta.entity';

@Injectable()
export class MetaRepository extends Repository<Meta> {
  constructor(private dataSource: DataSource) {
    super(Meta, dataSource.createEntityManager());
  }

  async findByKey(key: string): Promise<Meta | null> {
    return this.findOne({ where: { key } });
  }

  async upsertMeta(key: string, value: string): Promise<Meta> {
    await this.upsert({ key, value }, ['key']);
    return this.findByKey(key) as Promise<Meta>;
  }
}
