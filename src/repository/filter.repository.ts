import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Filter } from '../entities/filter.entity';

@Injectable()
export class FilterRepository extends Repository<Filter> {
  constructor(private dataSource: DataSource) {
    super(Filter, dataSource.createEntityManager());
  }

  async findByTier(tier: string): Promise<Filter[]> {
    return this.find({
      where: { tier: tier as any },
      relations: ['keywords'],
    });
  }

  async findBySlug(slug: string): Promise<Filter | null> {
    return this.findOne({
      where: { slug },
      relations: ['keywords'],
    });
  }

  async findByName(name: string): Promise<Filter | null> {
    return this.findOne({
      where: { name },
      relations: ['keywords'],
    });
  }
}
