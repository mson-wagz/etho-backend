import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsEventRepository } from '../../repository/analytics-event.repository';
import { ProductRepository } from '../../repository/product.repository';
import {
  AnalyticsStatsDto,
  BaseGetAnalyticsDto,
  CreateAnalyticsEvent,
  ProductPerformanceDto,
} from './dto/analytics-event.dto';
import { And, DataSource, In, LessThanOrEqual, MoreThan } from 'typeorm';
import { AnalyticsEventType } from 'src/types/enums/analytics.enum';
import { IngestionRunRepository } from 'src/repository/ingestion-run.repository';
import { IngestionStatus } from 'src/common/enums/ingestion.enum';
import { CategoryRepository } from 'src/repository/category.repository';
import { SearchQueryRepository } from 'src/repository/search-query.repository';

@Injectable()
export class AnalyticsEventService {
  constructor(
    private readonly analyticsEventRepository: AnalyticsEventRepository,
    private readonly ingestionRepository: IngestionRunRepository,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly searchQueryRepository: SearchQueryRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createAnalyticsEvent(eventData: CreateAnalyticsEvent): Promise<{
    event: {
      id: string;
      session_id: string;
      created_at: Date;
    };
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (eventData.product_id) {
        const product = await this.productRepository.findOne({
          where: { id: eventData.product_id },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id ${eventData.product_id} not found`,
          );
        }
      }

      const analyticsEvent = this.analyticsEventRepository.create({
        session_id: eventData.session_id,
        event_type: eventData.event_type as AnalyticsEventType,
        product_id: eventData.product_id,
        metadata: eventData.metadata || {},
      });

      const savedEvent = await queryRunner.manager.save(analyticsEvent);
      await queryRunner.commitTransaction();

      return {
        event: {
          id: savedEvent.id,
          session_id: savedEvent.session_id,
          created_at: savedEvent.created_at,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAnalyticsStats(
    dateRange: BaseGetAnalyticsDto,
  ): Promise<AnalyticsStatsDto> {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const periodDiff = endDate.getTime() - startDate.getTime();
    const periodDays = Math.round(periodDiff / (1000 * 60 * 60 * 24));

    const stats: AnalyticsStatsDto = {
      period_start: dateRange.startDate,
      period_end: dateRange.endDate,
      total_products_displayed: 0,
      products_ingested: {
        count: 0,
        trend_percentage: 0,
        trend: { value: periodDays, period: 'days' },
      },
      click_through_rate: {
        rate: 0,
        trend_percentage: 0,
        trend: { value: periodDays, period: 'days' },
      },
      total_redirects: 0,
    };

    // Calculate previous period dates for trend comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setTime(startDate.getTime() - periodDiff);
    const prevEndDate = new Date(startDate);

    // Get total products displayed
    stats.total_products_displayed = await this.productRepository.count();

    // Get products ingested with trend
    stats.products_ingested = await this.getProductsIngestedWithTrend(
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    );

    // Get CTR with trend
    const ctrData = await this.getCTRWithTrend(
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    );
    stats.click_through_rate = ctrData.ctr;
    stats.total_redirects = ctrData.totalRedirects;

    return stats;
  }

  private async getProductsIngestedWithTrend(
    currentStartDate: Date,
    currentEndDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<{
    count: number;
    trend_percentage: number;
    trend: { value: number; period: string };
  }> {
    // Current period
    const productsIngestedCurrent = await this.ingestionRepository.find({
      where: {
        started_at: And(
          MoreThan(currentStartDate),
          LessThanOrEqual(currentEndDate),
        ),
        status: IngestionStatus.COMPLETED,
      },
    });
    const totalIngested = productsIngestedCurrent.reduce(
      (sum, run) => sum + run.products_added + run.products_updated,
      0,
    );

    const productsIngestedPrev = await this.ingestionRepository.find({
      where: {
        started_at: And(MoreThan(prevStartDate), LessThanOrEqual(prevEndDate)),
        status: IngestionStatus.COMPLETED,
      },
    });
    const totalIngestedPrev = productsIngestedPrev.reduce(
      (sum, run) => sum + run.products_added + run.products_updated,
      0,
    );

    const trend_percentage = this.calculateTrendPercentage(
      totalIngested,
      totalIngestedPrev,
    );

    const periodDiff = prevEndDate.getTime() - prevStartDate.getTime();
    const periodDays = Math.round(periodDiff / (1000 * 60 * 60 * 24));

    return {
      count: totalIngested,
      trend_percentage: Math.round(trend_percentage * 100) / 100,
      trend: { value: periodDays, period: 'days' },
    };
  }

  private async getCTRWithTrend(
    currentStartDate: Date,
    currentEndDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<{
    ctr: {
      rate: number;
      trend_percentage: number;
      trend: { value: number; period: string };
    };
    totalRedirects: number;
  }> {
    // Current period
    const viewsCurrent = await this.analyticsEventRepository.count({
      where: {
        event_type: AnalyticsEventType.PRODUCT_VIEWED,
        created_at: And(
          MoreThan(currentStartDate),
          LessThanOrEqual(currentEndDate),
        ),
      },
    });

    const redirectsCurrent = await this.analyticsEventRepository.count({
      where: {
        event_type: AnalyticsEventType.CLICK_THROUGH,
        created_at: And(
          MoreThan(currentStartDate),
          LessThanOrEqual(currentEndDate),
        ),
      },
    });

    const ctrCurrent =
      viewsCurrent > 0 ? (redirectsCurrent / viewsCurrent) * 100 : 0;

    // Previous period
    const viewsPrev = await this.analyticsEventRepository.count({
      where: {
        event_type: AnalyticsEventType.PRODUCT_VIEWED,
        created_at: And(MoreThan(prevStartDate), LessThanOrEqual(prevEndDate)),
      },
    });

    const redirectsPrev = await this.analyticsEventRepository.count({
      where: {
        event_type: AnalyticsEventType.CLICK_THROUGH,
        created_at: And(MoreThan(prevStartDate), LessThanOrEqual(prevEndDate)),
      },
    });

    const ctrPrev = viewsPrev > 0 ? (redirectsPrev / viewsPrev) * 100 : 0;

    const trend_percentage = this.calculateTrendPercentage(ctrCurrent, ctrPrev);

    const periodDiff = prevEndDate.getTime() - prevStartDate.getTime();
    const periodDays = Math.round(periodDiff / (1000 * 60 * 60 * 24));

    return {
      ctr: {
        rate: Math.round(ctrCurrent * 100) / 100,
        trend_percentage: Math.round(trend_percentage * 100) / 100,
        trend: { value: periodDays, period: 'days' },
      },
      totalRedirects: redirectsCurrent,
    };
  }

  private calculateTrendPercentage(
    currentValue: number,
    previousValue: number,
  ): number {
    if (previousValue > 0) {
      return ((currentValue - previousValue) / previousValue) * 100;
    } else if (currentValue > 0) {
      return 100; // New data from nothing
    } else {
      return 0; // No data in both periods
    }
  }

  async getCTRTrend(
    dateRange: BaseGetAnalyticsDto,
  ): Promise<{ date: string; ctr: number }[]> {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    const result = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select("DATE(event.created_at AT TIME ZONE 'UTC')", 'date')
      .addSelect('event.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at > :startDate', { startDate })
      .andWhere('event.created_at <= :endDate', { endDate })
      .andWhere('event.event_type IN (:...eventTypes)', {
        eventTypes: [
          AnalyticsEventType.PRODUCT_VIEWED,
          AnalyticsEventType.CLICK_THROUGH,
        ],
      })
      .groupBy('date')
      .addGroupBy('event.event_type')
      .orderBy('date', 'ASC')
      .getRawMany();

    const dataByDate = new Map<
      string,
      { views: number; clickThroughs: number }
    >();

    result.forEach((row) => {
      const dateStr = row.date?.toISOString().split('T')[0] || '';
      let data = dataByDate.get(dateStr);
      if (!data) {
        data = { views: 0, clickThroughs: 0 };
        dataByDate.set(dateStr, data);
      }
      if (row.event_type === AnalyticsEventType.PRODUCT_VIEWED) {
        data.views = parseInt(row.count, 10);
      } else if (row.event_type === AnalyticsEventType.CLICK_THROUGH) {
        data.clickThroughs = parseInt(row.count, 10);
      }
    });

    const ctrTrend: { date: string; ctr: number }[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const data = dataByDate.get(dateStr) || { views: 0, clickThroughs: 0 };
      const ctr = data.views > 0 ? (data.clickThroughs / data.views) * 100 : 0;
      ctrTrend.push({ date: dateStr, ctr: Math.round(ctr * 100) / 100 });
    }

    return ctrTrend;
  }

  async getViewsTrend(
    dateRange: BaseGetAnalyticsDto,
  ): Promise<{ date: string; views: number }[]> {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    const result = await this.analyticsEventRepository
      .createQueryBuilder('event')
      .select("DATE(event.created_at AT TIME ZONE 'UTC')", 'date')
      .addSelect('COUNT(*)', 'views')
      .where('event.created_at >= :startDate', { startDate })
      .andWhere('event.created_at <= :endDate', { endDate })
      .andWhere('event.event_type = :eventType', {
        eventType: AnalyticsEventType.PRODUCT_VIEWED,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const viewsByDate = new Map<string, number>();
    result.forEach((row) => {
      viewsByDate.set(
        row.date?.toISOString().split('T')[0] || '',
        parseInt(row.views, 10),
      );
    });

    const viewsTrend: { date: string; views: number }[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const views = viewsByDate.get(dateStr) || 0;
      viewsTrend.push({ date: dateStr, views });
    }

    return viewsTrend;
  }

  async getMostSearchedTerms(
    limit: number = 10,
    dateRange: BaseGetAnalyticsDto,
  ): Promise<{ term: string; count: number }[]> {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    const result = await this.searchQueryRepository
      .createQueryBuilder('search_query')
      .select('search_query.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('search_query.searched_at >= :startDate', { startDate })
      .andWhere('search_query.searched_at <= :endDate', { endDate })
      .groupBy('search_query.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((row) => ({
      term: row.query,
      count: parseInt(row.count, 10),
    }));
  }

  async getClicksPerCategory(
    dateRange: BaseGetAnalyticsDto,
    parentCategoryId?: string,
  ): Promise<{ categoryId: string; categoryName: string; clicks: number }[]> {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    let categories;
    if (parentCategoryId) {
      categories =
        await this.categoryRepository.findByParentId(parentCategoryId);
    } else {
      categories = await this.categoryRepository.findRootCategories();
    }

    const result = await this.analyticsEventRepository.find({
      where: {
        event_type: AnalyticsEventType.CLICK_THROUGH,
        created_at: And(MoreThan(startDate), LessThanOrEqual(endDate)),
      },
      relations: ['product', 'product.category', 'product.category.parent'],
    });

    const clicksMap: Map<string, { name: string; clicks: number }> = new Map();

    result.forEach((event) => {
      const category = event.product?.category;
      if (!category) return;

      if (parentCategoryId) {
        if (category.parent_id === parentCategoryId) {
          const existing = clicksMap.get(category.id) || {
            name: category.name,
            clicks: 0,
          };
          clicksMap.set(category.id, {
            name: existing.name,
            clicks: existing.clicks + 1,
          });
        }
      } else {
        const parentCategory =
          category.parent_id === null ? category : category.parent;
        if (parentCategory) {
          const existing = clicksMap.get(parentCategory.id) || {
            name: parentCategory.name,
            clicks: 0,
          };
          clicksMap.set(parentCategory.id, {
            name: existing.name,
            clicks: existing.clicks + 1,
          });
        }
      }
    });

    categories.forEach((cat) => {
      if (!clicksMap.has(cat.id)) {
        clicksMap.set(cat.id, { name: cat.name, clicks: 0 });
      }
    });

    const clicksPerCategory: {
      categoryId: string;
      categoryName: string;
      clicks: number;
    }[] = [];
    clicksMap.forEach((data, categoryId) => {
      clicksPerCategory.push({
        categoryId,
        categoryName: data.name,
        clicks: data.clicks,
      });
    });

    return clicksPerCategory.sort((a, b) => b.clicks - a.clicks);
  }

  async getProductPerformance(
    dateRange: BaseGetAnalyticsDto,
    productIds?: string[],
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ProductPerformanceDto[]; total: number }> {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    {
      const countQueryBuilder = this.analyticsEventRepository
        .createQueryBuilder('event')
        .select('DISTINCT event.product_id')
        .where('event.created_at > :startDate', { startDate })
        .andWhere('event.created_at <= :endDate', { endDate });

      if (productIds && productIds.length > 0) {
        countQueryBuilder.andWhere('event.product_id IN (:...productIds)', {
          productIds,
        });
      }

      const countResults = await countQueryBuilder.getRawMany();
      const total = countResults.length;

      const skip = (page - 1) * limit;
      const queryBuilder = this.analyticsEventRepository
        .createQueryBuilder('event')
        .select('event.product_id', 'product_id')
        .addSelect(
          `SUM(CASE WHEN event.event_type = '${AnalyticsEventType.PRODUCT_VIEWED}' THEN 1 ELSE 0 END)`,
          'product_views',
        )
        .addSelect(
          `SUM(CASE WHEN event.event_type = '${AnalyticsEventType.PRODUCT_ADDED_TO_CART}' THEN 1 ELSE 0 END)`,
          'product_cart_adds',
        )
        .addSelect(
          `SUM(CASE WHEN event.event_type = '${AnalyticsEventType.CLICK_THROUGH}' THEN 1 ELSE 0 END)`,
          'product_redirects',
        )
        .where('event.created_at > :startDate', { startDate })
        .andWhere('event.created_at <= :endDate', { endDate })
        .groupBy('event.product_id')
        .offset(skip)
        .limit(limit);

      if (productIds && productIds.length > 0) {
        queryBuilder.andWhere('event.product_id IN (:...productIds)', {
          productIds,
        });
      }

      const rawResults = await queryBuilder.getRawMany();

      const productIdsToFetch = rawResults.map((row) => row.product_id);
      const products =
        productIdsToFetch.length > 0
          ? await this.productRepository.find({
              where: { id: In(productIdsToFetch) },
              relations: ['brand'],
            })
          : [];

      const productMap = new Map(products.map((p) => [p.id, p]));

      const performanceData: ProductPerformanceDto[] = [];

      for (const row of rawResults) {
        const product = productMap.get(row.product_id);

        if (product) {
          const ctr =
            parseInt(row.product_views, 10) > 0
              ? (parseInt(row.product_redirects, 10) /
                  parseInt(row.product_views, 10)) *
                100
              : 0;

          performanceData.push({
            product_name: product.name,
            brand_name: product.brand.name,
            product_views: parseInt(row.product_views, 10),
            product_cart_adds: parseInt(row.product_cart_adds, 10),
            product_redirects: parseInt(row.product_redirects, 10),
            product_ctr: Math.round(ctr * 100) / 100,
          });
        }
      }

      return { data: performanceData, total };
    }
  }
}
