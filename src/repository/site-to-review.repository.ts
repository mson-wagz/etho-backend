import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  SiteToReview,
  SiteReviewStatus,
} from '../entities/site-to-review.entity';

@Injectable()
export class SiteToReviewRepository extends Repository<SiteToReview> {
  constructor(private dataSource: DataSource) {
    super(SiteToReview, dataSource.createEntityManager());
  }

  async findPaginated(
    page: number,
    limit: number,
    status?: SiteReviewStatus,
  ): Promise<{ items: SiteToReview[]; total: number }> {
    const qb = this.createQueryBuilder('site')
      .orderBy('site.discovered_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.where('site.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getStats(): Promise<{
    total: number;
    awaitingReview: number;
    scrapable: number;
    tosRestricted: number;
  }> {
    const [total, awaitingReview, scrapable, tosRestricted] = await Promise.all(
      [
        this.count(),
        this.count({ where: { status: SiteReviewStatus.AWAITING_REVIEW } }),
        this.count({ where: { is_scrapable: true } }),
        this.count({ where: { tos_allows_scraping: false } }),
      ],
    );
    return { total, awaitingReview, scrapable, tosRestricted };
  }
}
