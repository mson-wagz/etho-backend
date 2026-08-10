import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FilterKeyword } from '../entities/filter-keyword.entity';

@Injectable()
export class FilterKeywordRepository extends Repository<FilterKeyword> {
  constructor(private dataSource: DataSource) {
    super(FilterKeyword, dataSource.createEntityManager());
  }

  async findByFilterId(filterId: string): Promise<FilterKeyword[]> {
    return this.find({ where: { filter_id: filterId } });
  }

  async findByKeyword(keyword: string): Promise<FilterKeyword[]> {
    return this.find({ where: { keyword } });
  }

  async findByKeywordAndFilterId(
    keyword: string,
    filterId: string,
  ): Promise<FilterKeyword | null> {
    return this.findOne({ where: { keyword, filter_id: filterId } });
  }

  async findByKeywordAndFilterIdExcludingId(
    keyword: string,
    filterId: string,
    excludeId: string,
  ): Promise<FilterKeyword | null> {
    return this.createQueryBuilder('keyword')
      .where('keyword.keyword = :keyword', { keyword })
      .andWhere('keyword.filter_id = :filterId', { filterId })
      .andWhere('keyword.id != :excludeId', { excludeId })
      .getOne();
  }
}
