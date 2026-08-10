import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SearchQuery } from '../entities/search-query.entity';

@Injectable()
export class SearchQueryRepository extends Repository<SearchQuery> {
  constructor(private dataSource: DataSource) {
    super(SearchQuery, dataSource.createEntityManager());
  }

  async findBySessionId(sessionId: string): Promise<SearchQuery[]> {
    return this.find({ where: { session_id: sessionId } });
  }

  async logSearch(
    query: string,
    total: number,
    sessionId?: string,
    filtersApplied?: Record<string, any>,
  ): Promise<void> {
    try {
      const searchQuery = this.create({
        query,
        results_count: total,
        session_id: sessionId,
        filters_applied: filtersApplied,
      });

      await this.save(searchQuery);
    } catch (error) {
      console.error('Failed to log search query:', error);
      throw error;
    }
  }
}
