import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { BrandRepository } from '../../repository/brand.repository';
import {
  BrandsIngestionQueryDto,
  SortBy,
} from './dto/brands-ingestion-query.dto';
import { BrandsIngestionResponseDto } from './dto/brands-ingestion-response.dto';
import { BrandRunHistoryResponseDto } from './dto/brand-run-history-response.dto';
import { IngestionRunRepository } from '../../repository/ingestion-run.repository';
import { GeneralSettingsRepository } from 'src/repository/general-settings.repository';
import { SitesToScraperQueueProducerService } from '../queue/queues/sitesToScraperQueueProducer.service';
import {
  IngestionRunType,
  IngestionStatus,
} from 'src/common/enums/ingestion.enum';
import { CrawlJobData } from 'src/types/consumer';
import { PeriodUnit } from 'src/entities/general-settings.entity';
import { CronService } from '../cron/cron.service';
import { SITE_SCRAPE_CRON } from 'src/types/cron';

@Injectable()
export class IngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionService.name);
  constructor(
    private readonly cronService: CronService,
    private readonly generalSettingsRepository: GeneralSettingsRepository,
    private readonly sitesToScraperQueueProducerService: SitesToScraperQueueProducerService,
    private readonly brandRepository: BrandRepository,
    private readonly ingestionRunRepository: IngestionRunRepository,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeAutoScraping();
    } catch (error) {
      this.logger.error('Failed to initialize auto-scraping cron job', error);
    }
  }

  async onModuleDestroy() {
    await this.cronService.deleteCronJob(SITE_SCRAPE_CRON);
  }

  private async initializeAutoScraping() {
    const scrapingSettings = await this.generalSettingsRepository.getSettings();
    if (!scrapingSettings) {
      throw new NotFoundException('General settings not found');
    }

    const scrapingFrequency = scrapingSettings.scraping_frequency;
    const autoScrapeEnabledSetting = scrapingFrequency !== 0;
    const scrapingFrequencyPeriod =
      scrapingSettings.scraping_frequency_period_value; //eg 1
    const scrapingFrequencyUnit =
      scrapingSettings.scraping_frequency_period_unit; //eg 'hour'
    //all abouve can come to eg 2 times an hour, 1 time a day etc

    if (!autoScrapeEnabledSetting) {
      this.logger.log(
        'Auto-scraping is disabled. No cron job will be scheduled.',
      );
      return;
    }

    const brandsToScrape = await this.brandRepository.find({
      relations: ['ingestion_runs'],
      select: {
        id: true,
        name: true,
        website_url: true,
        last_scraped_at: true,
        scrape_status: true,
        ingestion_runs: {
          status: true,
          started_at: true,
        },
      },
    });

    const callback = async () => {
      const brandsToEnqueue = brandsToScrape.filter((brand) => {
        const latestIngestionRun = brand.ingestion_runs.sort(
          (a, b) => b.started_at.getTime() - a.started_at.getTime(),
        )[0];
        return (
          !latestIngestionRun ||
          latestIngestionRun.status === IngestionStatus.COMPLETED
        );
      });

      const crawlJobDataArray: CrawlJobData[] = await Promise.all(
        brandsToEnqueue.map(async (b) => {
          const ingestionRun = this.ingestionRunRepository.create({
            brand_id: b.id,
            run_type: IngestionRunType.SCHEDULED,
            status: IngestionStatus.STANDBY,
          });

          const savedRun = await this.ingestionRunRepository.save(ingestionRun);

          return {
            brandId: b.id,
            brandName: b.name,
            triggeredBy: 'auto-scrape',
            ingestionMode: 'incremental',
            ingestionRunId: savedRun.id,
          };
        }),
      );

      await this.sitesToScraperQueueProducerService.addBulkCrawlJobs(
        crawlJobDataArray,
      );
    };

    let cronTime: string;
    switch (scrapingFrequencyUnit) {
      case PeriodUnit.DAYS:
        cronTime = `0 0 */${scrapingFrequencyPeriod} * *`;
        break;
      case PeriodUnit.MONTHS:
        cronTime = `0 0 1 */${scrapingFrequencyPeriod} *`;
        break;
      case PeriodUnit.WEEKS:
        const daysInterval = scrapingFrequencyPeriod * 7;
        cronTime = `0 0 */${daysInterval} * *`;
        break;
      case PeriodUnit.YEARS:
        cronTime = `0 0 1 1 */${scrapingFrequencyPeriod}`;
        break;
      default:
        throw new Error('Invalid scraping frequency unit');
    }
    await this.cronService.createCronJob(SITE_SCRAPE_CRON, cronTime, callback);
    this.logger.log(
      `Auto-scraping cron job initialized with schedule: ${cronTime}`,
    );
  }

  async updateIngestionCronJob() {
    if (this.cronService.isCronJobActive(SITE_SCRAPE_CRON)) {
      await this.cronService.deleteCronJob(SITE_SCRAPE_CRON);
    }
    await this.initializeAutoScraping();
  }

  async getBrandsIngestionLogs(
    query: BrandsIngestionQueryDto,
  ): Promise<BrandsIngestionResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      brandId,
      search,
      sortBy,
      sortOrder,
    } = query;

    const queryBuilder = this.brandRepository
      .createQueryBuilder('brand')
      .leftJoin(
        (qb) => {
          return qb
            .select([
              'ir.id AS ir_id',
              'ir.brand_id AS ir_brand_id',
              'ir.status AS ir_status',
              'ir.products_added AS ir_products_added',
              'ir.products_updated AS ir_products_updated',
              'ir.products_excluded AS ir_products_excluded',
              'ir.started_at AS ir_started_at',
              'ir.errors AS ir_errors',
              'ROW_NUMBER() OVER (PARTITION BY ir.brand_id ORDER BY ir.started_at DESC) as rn',
            ])
            .from('ingestion_runs', 'ir');
        },
        'latest_run',
        'latest_run.ir_brand_id = brand.id AND latest_run.rn = 1',
      )
      .select([
        'brand.id AS brand_id',
        'brand.name AS source_name',
        "COALESCE(latest_run.ir_status, 'standby') AS status",
        'COALESCE(latest_run.ir_products_added, 0) + COALESCE(latest_run.ir_products_updated, 0) AS products_ingested',
        'COALESCE(latest_run.ir_products_excluded, 0) AS products_excluded',
        'COALESCE(latest_run.ir_products_updated, 0) AS products_updated',
        'latest_run.ir_started_at AS last_run',
        'latest_run.ir_errors AS errors',
        'latest_run.ir_id AS active_ingestion_run_id',
      ]);

    // Apply filters
    if (status) {
      if (status === 'standby') {
        queryBuilder.andWhere(
          "COALESCE(latest_run.ir_status, 'standby') = :status",
          { status },
        );
      } else {
        queryBuilder.andWhere('latest_run.ir_status = :status', { status });
      }
    }

    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    if (search) {
      queryBuilder.andWhere('brand.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Apply sorting
    const sortField =
      sortBy === SortBy.SOURCE_NAME ? 'brand.name' : 'latest_run.ir_started_at';
    queryBuilder.orderBy(sortField, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.offset(skip).limit(Number(limit));

    // Execute query
    const logs = await queryBuilder.getRawMany();

    return {
      logs: logs.map((log) => ({
        brand_id: log.brand_id,
        source_name: log.source_name,
        status: log.status,
        products_ingested: parseInt(log.products_ingested) || 0,
        products_excluded: parseInt(log.products_excluded) || 0,
        products_updated: parseInt(log.products_updated) || 0,
        errors:
          log.errors?.map((err) => ({
            message: err.message,
            timestamp: err.timestamp,
          })) || [],
        last_run: log.last_run,
        active_ingestion_run_id:
          log.status === 'in_progress'
            ? log.active_ingestion_run_id
            : undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBrandRunHistory(
    brandId: string,
    limit: number = 10,
  ): Promise<BrandRunHistoryResponseDto> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const runs = await this.ingestionRunRepository.find({
      where: { brand_id: brandId },
      order: { started_at: 'DESC' },
      take: limit,
    });

    const allRuns = await this.ingestionRunRepository.find({
      where: { brand_id: brandId },
    });

    const totalRuns = allRuns.length;
    const successfulRuns = allRuns.filter(
      (run) => run.status === 'completed',
    ).length;
    const failedRuns = allRuns.filter((run) => run.status === 'failed').length;

    const completedRuns = allRuns.filter(
      (run) => run.status === 'completed' && run.duration_seconds,
    );
    const avgDuration =
      completedRuns.length > 0
        ? completedRuns.reduce((sum, run) => sum + run.duration_seconds, 0) /
          completedRuns.length
        : 0;

    const lastSuccessful = allRuns.find((run) => run.status === 'completed');

    return {
      runs: runs.map((run) => ({
        id: run.id,
        status: run.status,
        run_type: run.run_type,
        products_fetched: run.products_fetched,
        products_added: run.products_added,
        products_updated: run.products_updated,
        products_excluded: run.products_excluded,
        errors_count: run.errors_count,
        started_at: run.started_at,
        completed_at: run.completed_at,
        duration_seconds: run.duration_seconds,
      })),
      total_runs: totalRuns,
      successful_runs: successfulRuns,
      failed_runs: failedRuns,
      avg_duration_seconds: Math.round(avgDuration),
      last_successful_run: lastSuccessful?.started_at || null,
    };
  }
}
