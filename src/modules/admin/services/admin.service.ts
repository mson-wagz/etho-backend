import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { FilterService } from '../../filters/filters.service';
import { IngestionService } from '../../ingestion/ingestion.service';
import { BrandRepository } from '../../../repository/brand.repository';
import { IngestionRunRepository } from '../../../repository/ingestion-run.repository';
import { GeneralSettingsRepository } from '../../../repository/general-settings.repository';
import { CertificationRepository } from '../../../repository/certification.repository';
import { FilterRepository } from '../../../repository/filter.repository';
import { FilterKeywordRepository } from '../../../repository/filter-keyword.repository';
import { ProductRepository } from '../../../repository/product.repository';
import { DataSource, EntityManager } from 'typeorm';
import { AdminFilterSettingsResponseDto } from '../dto/admin-filter-settings.dto';
import { CreateFilterDto } from '../dto/create-filter.dto';
import { UpdateFilterDto } from '../dto/update-filter.dto';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AdminCertificationResponseDto } from '../dto/admin-certification-response.dto';
import { CreateKeywordDto } from '../dto/create-keyword.dto';
import { UpdateKeywordDto } from '../dto/update-keyword.dto';
import { AdminKeywordResponseDto } from '../dto/admin-keyword-response.dto';
import {
  ApplyFilterSettingsDto,
  ApplyFilterSettingsResponseDto,
  AppliedOperationResultDto,
  ApplyOperationType,
  ApplyModelType,
} from '../dto/apply-filter-settings.dto';
import { GeneralSettingsResponseDto } from '../dto/general-settings-response.dto';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';
import { IngestionStatsResponseDto } from '../dto/ingestion-stats.dto';
import { BrandsIngestionQueryDto } from '../../ingestion/dto/brands-ingestion-query.dto';
import { BrandsIngestionResponseDto } from '../../ingestion/dto/brands-ingestion-response.dto';
import { DownloadFormat } from '../dto/brand-ingestion-download.dto';
import { RerunIngestionDto } from '../dto/rerun-ingestion.dto';
import { RerunIngestionResponseDto } from '../dto/rerun-ingestion-response.dto';
import { Response } from 'express';
import { AnalyticsEventService } from '../../analytics-event/analytics-event.service';
import { BaseGetAnalyticsDto } from 'src/modules/analytics-event/dto/analytics-event.dto';
import {
  GeneralSettings,
  PeriodUnit,
} from '../../../entities/general-settings.entity';
import { Filter, FilterTier } from '../../../entities/filter.entity';
import { Certification } from '../../../entities/certification.entity';
import { FilterKeyword } from '../../../entities/filter-keyword.entity';
import { ProductsService } from 'src/modules/products/products.service';
import { FilterProductDto } from 'src/modules/products/dto/filter-product.dto';
import { SitesToScraperQueueProducerService } from '../../queue/queues/sitesToScraperQueueProducer.service';
import {
  IngestionRunType,
  IngestionStatus,
} from '../../../common/enums/ingestion.enum';
import { IngestionMode } from '../dto/rerun-ingestion.dto';
import {
  ConfigureSourceDto,
  SaveConfiguredSourceDto,
  SaveRegeneratedConfigDto,
} from '../dto/add-source.dto';
import { EditSourceDto, BrandConfigResponseDto } from '../dto/edit-source.dto';
import { SitesToConfigureQueueProducerService } from 'src/modules/queue/queues/sitesToConfigureQueueProducer.service';
import { SitesToDiscoverQueueProducerService } from 'src/modules/queue/queues/sitesToDiscoverQueueProducer.service';
import { ScrapingSourceRepository } from 'src/repository/scraping-source.repository';
import { DeleteBrandDto, DeleteBrandMode } from '../dto/delete-brand.dto';
import { CronTime } from 'cron';
import { SiteToReviewRepository } from 'src/repository/site-to-review.repository';
import { SourceHistoryRepository } from '../../../repository/source-history.repository';
import { SourceHistoryItemDto } from '../dto/source-history.dto';
import { RedisService } from '../../redis/redis.service';
import {
  DiscoveryStatsResponseDto,
  DiscoveryResultsQueryDto,
  DiscoveryResultsResponseDto,
  TriggerDiscoveryResponseDto,
  DiscoveryRunStatusResponseDto,
} from '../dto/admin-discovery.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly filterService: FilterService,
    private readonly ingestionService: IngestionService,
    private readonly brandRepository: BrandRepository,
    private readonly scrapingSourceRepository: ScrapingSourceRepository,
    private readonly ingestionRunRepository: IngestionRunRepository,
    private readonly generalSettingsRepository: GeneralSettingsRepository,
    private readonly certificationRepository: CertificationRepository,
    private readonly filterRepository: FilterRepository,
    private readonly filterKeywordRepository: FilterKeywordRepository,
    private readonly analyticsEventService: AnalyticsEventService,
    private readonly productsService: ProductsService,
    private readonly sitesToScraperQueueProducer: SitesToScraperQueueProducerService,
    private readonly sitesToConfigureQueueProducerService: SitesToConfigureQueueProducerService,
    private readonly sitesToDiscoverQueueProducerService: SitesToDiscoverQueueProducerService,
    private readonly productRepository: ProductRepository,
    private readonly dataSource: DataSource,
    private readonly siteToReviewRepository: SiteToReviewRepository,
    private readonly sourceHistoryRepository: SourceHistoryRepository,
    private readonly redisService: RedisService,
  ) {}

  async configureBrandForAddition(configureSourceDto: ConfigureSourceDto) {
    const { urlToConfigure, overrideTosCheck, overrideRobotsCheck } =
      configureSourceDto;
    const jobId = await this.sitesToConfigureQueueProducerService.addConfigJob(
      urlToConfigure,
      {
        triggeredBy: 'admin-add-source',
        priority: 1,
        delay: 0,
        overrideTosCheck,
        overrideRobotsCheck,
      },
    );
    return { jobId };
  }

  async getBrandAdditionStatus(jobId: string) {
    const job =
      await this.sitesToConfigureQueueProducerService.getJobDetails(jobId);
    return job;
  }

  async saveConfiguredBrand(savedConfiguredBrand: SaveConfiguredSourceDto) {
    const brandConfig = savedConfiguredBrand;
    const isExistingBrand = await this.brandRepository.findByWebsiteUrl(
      this.extractHostname(brandConfig.website_url),
    );

    if (isExistingBrand) {
      console.log(
        `Brand with website URL ${brandConfig.website_url} already exists. Skipping creation.`,
      );
      return;
    }
    const newBrand = this.brandRepository.create({
      name: this.extractHostname(brandConfig.name),
      website_url: brandConfig.website_url,
      description: brandConfig.description,
    });

    this.brandRepository.save(newBrand).then(async (savedBrand) => {
      const newScrapingSource = this.scrapingSourceRepository.create({
        brand_id: savedBrand.id,
        config: brandConfig.config,
        is_active: true,
      });
      await this.scrapingSourceRepository.save(newScrapingSource);
      await this.sourceHistoryRepository.createEntry({
        name: savedBrand.name,
        website_url: savedBrand.website_url,
        origin: 'manual',
        deleted_at: null,
      });
    });
  }

  async saveRegeneratedConfig(
    brandId: string,
    config: SaveRegeneratedConfigDto['config'],
  ): Promise<{ message: string }> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const source = await this.scrapingSourceRepository.findOne({
      where: { brand_id: brandId },
    });
    if (!source) {
      throw new NotFoundException('Scraping source not found for this brand');
    }

    source.config = config;
    await this.scrapingSourceRepository.save(source);

    return { message: 'Regenerated config saved successfully' };
  }

  async getBrandConfig(brandId: string): Promise<BrandConfigResponseDto> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    const source = await this.scrapingSourceRepository.findOne({
      where: { brand_id: brandId },
    });
    const config = (source?.config ?? {}) as Record<string, unknown>;
    return {
      name: brand.name,
      description: brand.description ?? '',
      websiteUrl: brand.website_url,
      collectionUrls: (config.collectionUrls as string[]) ?? [],
    };
  }

  async editSource(dto: EditSourceDto): Promise<{ message: string }> {
    const { brandId, brandName, description, collectionUrls } = dto;

    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (collectionUrls && collectionUrls.length > 0) {
      let brandDomain: string;
      try {
        brandDomain = new URL(brand.website_url).hostname.replace(/^www\./, '');
      } catch {
        throw new BadRequestException('Brand has an invalid website URL');
      }
      for (const url of collectionUrls) {
        let urlDomain: string;
        try {
          urlDomain = new URL(url).hostname.replace(/^www\./, '');
        } catch {
          throw new BadRequestException(`Invalid URL: ${url}`);
        }
        if (urlDomain !== brandDomain) {
          throw new BadRequestException(
            `URL "${url}" does not belong to the same domain as the brand (${brandDomain})`,
          );
        }
      }
    }

    if (brandName !== undefined) {
      brand.name = brandName;
    }
    if (description !== undefined) {
      brand.description = description;
    }
    await this.brandRepository.save(brand);

    const source = await this.scrapingSourceRepository.findOne({
      where: { brand_id: brandId },
    });
    if (source) {
      const config = (source.config ?? {}) as Record<string, unknown>;
      if (collectionUrls !== undefined) {
        config.collectionUrls = collectionUrls;
      }
      source.config = config;
      await this.scrapingSourceRepository.save(source);
    }

    return { message: 'Source updated successfully' };
  }

  async deleteBrand(
    deleteBrandDto: DeleteBrandDto,
  ): Promise<{ message: string }> {
    const { id, mode } = deleteBrandDto;
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (mode === DeleteBrandMode.PRODUCTS_ONLY) {
      await this.productRepository.deleteProductsWithRelations(id);
      await this.scrapingSourceRepository.update(
        { id },
        {
          last_successful_scrape: undefined,
          last_error: undefined,
          failure_count: 0,
          success_count: 0,
        },
      );
      await this.ingestionRunRepository.delete({ brand_id: id });
    } else if (mode === DeleteBrandMode.PRODUCTS_AND_BRAND) {
      await this.productRepository.deleteProductsWithRelations(id);
      const existing = await this.sourceHistoryRepository.findByNameOrUrl(
        brand.name,
        brand.website_url,
      );
      if (!existing) {
        await this.sourceHistoryRepository.createEntry({
          name: brand.name,
          website_url: brand.website_url,
          origin: 'manual',
          deleted_at: new Date(),
          added_at: brand.created_at ?? undefined,
        });
      }
      await this.brandRepository.delete({ id });
    }

    return {
      message:
        mode === DeleteBrandMode.PRODUCTS_ONLY
          ? 'Brand products deleted successfully'
          : 'Brand and its products deleted successfully',
    };
  }

  async getSourceHistory(): Promise<SourceHistoryItemDto[]> {
    return this.sourceHistoryRepository.findAll();
  }

  private extractHostname(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch (error) {
      console.error(`Invalid URL provided: ${url}`);
      return url;
    }
  }

  async getFilterSettings(
    categoryName?: string,
    searchQuery?: string,
  ): Promise<AdminFilterSettingsResponseDto> {
    return await this.filterService.getAdminFilterSettings(
      categoryName,
      searchQuery,
    );
  }

  async createFilter(createFilterDto: CreateFilterDto): Promise<Filter> {
    return await this.filterService.createFilter(createFilterDto);
  }

  async updateFilter(
    id: string,
    updateFilterDto: UpdateFilterDto,
  ): Promise<Filter> {
    return await this.filterService.updateFilter(id, updateFilterDto);
  }

  async deleteFilter(id: string): Promise<void> {
    return await this.filterService.deleteFilter(id);
  }

  private toGeneralSettingsResponseDto(
    settings: GeneralSettings,
  ): GeneralSettingsResponseDto {
    return {
      scraping_frequency: settings.scraping_frequency,
      scraping_frequency_period_value: settings.scraping_frequency_period_value,
      scraping_frequency_period_unit: settings.scraping_frequency_period_unit,
      discovery_max_queries: settings.discovery_max_queries,
    };
  }

  async getGeneralSettings(): Promise<GeneralSettingsResponseDto> {
    let settings = await this.generalSettingsRepository.getSettings();

    if (!settings) {
      throw new InternalServerErrorException(
        'Failed to retrieve general settings',
      );
    }

    return this.toGeneralSettingsResponseDto(settings);
  }

  async updateGeneralSettings(
    updateDto: UpdateGeneralSettingsDto,
  ): Promise<GeneralSettingsResponseDto> {
    if (updateDto.scraping_frequency > 0) {
      const periodValue = updateDto.scraping_frequency_period_value;
      const periodUnit = updateDto.scraping_frequency_period_unit;

      if (periodUnit === PeriodUnit.WEEKS && periodValue > 52) {
        throw new BadRequestException(
          `Scraping frequency cannot exceed 52 weeks. Please adjust your schedule or use months/years instead.`,
        );
      }

      if (periodUnit === PeriodUnit.DAYS && periodValue > 365) {
        throw new BadRequestException(
          `Scraping frequency cannot exceed 365 days. Please use weeks, months, or years for longer intervals.`,
        );
      }

      if (periodUnit === PeriodUnit.MONTHS && periodValue > 12) {
        throw new BadRequestException(
          `Scraping frequency cannot exceed 12 months. Please use years for longer intervals.`,
        );
      }

      let cronTime: string;
      switch (updateDto.scraping_frequency_period_unit) {
        case PeriodUnit.DAYS:
          cronTime = `0 0 */${updateDto.scraping_frequency_period_value} * *`;
          break;
        case PeriodUnit.MONTHS:
          cronTime = `0 0 1 */${updateDto.scraping_frequency_period_value} *`;
          break;
        case PeriodUnit.WEEKS:
          const daysInterval = updateDto.scraping_frequency_period_value * 7;
          cronTime = `0 0 */${daysInterval} * *`;
          break;
        case PeriodUnit.YEARS:
          cronTime = `0 0 1 1 */${updateDto.scraping_frequency_period_value}`;
          break;
        default:
          throw new BadRequestException(
            'Invalid scraping frequency unit. Please select days, weeks, months, or years.',
          );
      }
      const isValidCron = CronTime.validateCronExpression(cronTime!);
      if (!isValidCron.valid) {
        console.error(
          `Invalid cron expression: ${cronTime}, errors: ${isValidCron.error}, dto: ${JSON.stringify(updateDto)}`,
        );
        throw new BadRequestException(
          `The scraping frequency settings are invalid. Please try a different combination of frequency and period.`,
        );
      }
    }

    const updatedSettings =
      await this.generalSettingsRepository.updateSettings(updateDto);

    if (!updatedSettings) {
      throw new NotFoundException('Failed to update general settings');
    }

    await this.ingestionService.updateIngestionCronJob();

    return this.toGeneralSettingsResponseDto(updatedSettings);
  }

  async getBrandsIngestionLogs(
    query: BrandsIngestionQueryDto,
  ): Promise<BrandsIngestionResponseDto> {
    return await this.ingestionService.getBrandsIngestionLogs(query);
  }

  async getIngestionStats(): Promise<IngestionStatsResponseDto> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    const totalSources = await this.brandRepository
      .createQueryBuilder('brand')
      .select('COUNT(DISTINCT brand.id)', 'count')
      .getRawOne();

    const totalProductsResult = await this.ingestionRunRepository
      .createQueryBuilder('run')
      .select(
        'SUM(COALESCE(run.products_added, 0) + COALESCE(run.products_updated, 0))',
        'total',
      )
      .getRawOne();

    const todayProductsResult = await this.ingestionRunRepository
      .createQueryBuilder('run')
      .select(
        'SUM(COALESCE(run.products_added, 0) + COALESCE(run.products_updated, 0))',
        'total',
      )
      .where('run.started_at >= :todayStart', { todayStart })
      .getRawOne();

    const yesterdayProductsResult = await this.ingestionRunRepository
      .createQueryBuilder('run')
      .select(
        'SUM(COALESCE(run.products_added, 0) + COALESCE(run.products_updated, 0))',
        'total',
      )
      .where(
        'run.started_at >= :yesterdayStart AND run.started_at < :yesterdayEnd',
        {
          yesterdayStart,
          yesterdayEnd,
        },
      )
      .getRawOne();

    const failedIngestionsResult = await this.ingestionRunRepository
      .createQueryBuilder('run')
      .select('COUNT(*)', 'count')
      .where('run.status = :status', { status: 'failed' })
      .getRawOne();

    const excludedProductsResult = await this.ingestionRunRepository
      .createQueryBuilder('run')
      .select('SUM(COALESCE(run.products_excluded, 0))', 'total')
      .getRawOne();

    const todayCount = parseInt(todayProductsResult?.total) || 0;
    const yesterdayCount = parseInt(yesterdayProductsResult?.total) || 0;
    const changePercentage =
      yesterdayCount > 0
        ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
        : todayCount > 0
          ? 100
          : 0;

    return {
      total_sources: parseInt(totalSources?.count) || 0,
      products_ingested: {
        total: parseInt(totalProductsResult?.total) || 0,
        today: todayCount,
        change_percentage: Math.round(changePercentage * 100) / 100,
      },
      failed_ingestions: parseInt(failedIngestionsResult?.count) || 0,
      products_excluded: parseInt(excludedProductsResult?.total) || 0,
    };
  }

  async getAnalyticsStats(dateRange: BaseGetAnalyticsDto) {
    return await this.analyticsEventService.getAnalyticsStats(dateRange);
  }

  async getCTRTrend(dateRange: BaseGetAnalyticsDto) {
    return await this.analyticsEventService.getCTRTrend(dateRange);
  }

  async getMostSearchedTerms(dateRange: BaseGetAnalyticsDto) {
    return await this.analyticsEventService.getMostSearchedTerms(5, dateRange);
  }

  async getClicksPerCategory(
    dateRange: BaseGetAnalyticsDto,
    parentCategoryId?: string,
  ) {
    return await this.analyticsEventService.getClicksPerCategory(
      dateRange,
      parentCategoryId,
    );
  }

  async getViewsTrend(dateRange: BaseGetAnalyticsDto) {
    return await this.analyticsEventService.getViewsTrend(dateRange);
  }

  async getProductPerformance(
    dateRange: BaseGetAnalyticsDto,
    productIds?: string[],
    page?: number,
    limit?: number,
  ) {
    return await this.analyticsEventService.getProductPerformance(
      dateRange,
      productIds,
      page,
      limit,
    );
  }

  async downloadBrandIngestionLog(
    brandId: string,
    format: DownloadFormat,
    response: Response,
  ): Promise<void> {
    // Fetch brand with ingestion runs
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
      relations: ['ingestion_runs'],
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${brand.name.replace(/[^a-zA-Z0-9]/g, '_')}_ingestion_log_${timestamp}.${format}`;

    if (format === DownloadFormat.JSON) {
      // JSON format: full nested data
      const jsonData = {
        brand: {
          id: brand.id,
          name: brand.name,
          website_url: brand.website_url,
          last_scraped_at: brand.last_scraped_at,
          scrape_status: brand.scrape_status,
        },
        ingestion_runs: brand.ingestion_runs.map((run) => ({
          id: run.id,
          run_type: run.run_type,
          status: run.status,
          products_fetched: run.products_fetched,
          products_added: run.products_added,
          products_updated: run.products_updated,
          products_excluded: run.products_excluded,
          errors_count: run.errors_count,
          errors: run.errors,
          started_at: run.started_at,
          completed_at: run.completed_at,
          duration_seconds: run.duration_seconds,
        })),
        total_runs: brand.ingestion_runs.length,
        generated_at: new Date().toISOString(),
      };

      response.setHeader('Content-Type', 'application/json');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      response.json(jsonData);
    } else {
      // CSV format: flat tabular data
      const csvHeaders = [
        'Run ID',
        'Run Type',
        'Status',
        'Products Fetched',
        'Products Added',
        'Products Updated',
        'Products Excluded',
        'Errors Count',
        'Started At',
        'Completed At',
        'Duration (seconds)',
      ];

      const csvRows = brand.ingestion_runs.map((run) => [
        run.id,
        run.run_type,
        run.status,
        run.products_fetched,
        run.products_added,
        run.products_updated,
        run.products_excluded,
        run.errors_count,
        run.started_at?.toISOString() ?? '',
        run.completed_at?.toISOString() ?? '',
        run.duration_seconds ?? '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) =>
          row
            .map((field) => {
              const value = field ?? '';
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(','),
        )
        .join('\n');

      response.setHeader('Content-Type', 'text/csv');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      response.send(csvContent);
    }
  }

  async getAdminProductStats() {
    return await this.productsService.getAdminProductStats();
  }

  async getProducts(filter: FilterProductDto) {
    return await this.productsService.getProducts(filter);
  }

  async getProductById(id: string) {
    return await this.productsService.getProductById(id);
  }

  async updateProduct(id: string, updateData: any) {
    return await this.productsService.updateProduct(id, updateData);
  }

  async deleteProduct(id: string) {
    return await this.productsService.deleteProduct(id);
  }

  async rerunBrandIngestion(
    brandId: string,
    rerunDto: RerunIngestionDto,
  ): Promise<RerunIngestionResponseDto> {
    // Check if brand exists and is active
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (brand.scrape_status && brand.scrape_status !== 'active') {
      throw new BadRequestException('Brand is not active');
    }

    const pendingRun = await this.ingestionRunRepository.findOne({
      where: {
        brand_id: brandId,
        run_type: IngestionRunType.MANUAL,
        status: IngestionStatus.STANDBY,
      },
    });

    if (pendingRun) {
      throw new HttpException(
        'A rerun is already pending for this brand',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRuns = await this.ingestionRunRepository.find({
      where: {
        brand_id: brandId,
        run_type: IngestionRunType.MANUAL,
        status: IngestionStatus.COMPLETED,
      },
      order: { started_at: 'DESC' },
    });

    const recentRunsWithinHour = recentRuns.filter(
      (run) => run.started_at && run.started_at >= oneHourAgo,
    );

    if (recentRunsWithinHour.length >= 3) {
      throw new HttpException(
        'Rate limit exceeded - max 3 reruns per hour per brand',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (rerunDto.mode === IngestionMode.FULL) {
      try {
        await this.productRepository.deleteProductsWithRelations(brandId);
      } catch (error) {
        console.error('Failed to delete products for full rerun:', error);
        throw new HttpException(
          'Failed to delete existing products for full rerun',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    const ingestionRun = this.ingestionRunRepository.create({
      brand_id: brandId,
      run_type: IngestionRunType.MANUAL,
      status: IngestionStatus.STANDBY,
    });

    const savedRun = await this.ingestionRunRepository.save(ingestionRun);

    try {
      await this.sitesToScraperQueueProducer.addCrawlJob(brand.name, {
        brandName: brand.name,
        triggeredBy: 'admin-rerun',
        priority: rerunDto.mode === 'full' ? 2 : 1,
        brandId: brandId,
        ingestionRunId: savedRun.id,
        ingestionMode: rerunDto.mode,
      });
    } catch (err) {
      await this.ingestionRunRepository.update(savedRun.id, {
        status: IngestionStatus.FAILED,
      });
      throw err;
    }

    return {
      ingestion_run_id: savedRun.id,
      status: savedRun.status,
      mode: rerunDto.mode,
    };
  }

  async getBrandRunHistory(brandId: string) {
    return await this.ingestionService.getBrandRunHistory(brandId);
  }

  async getIngestionRunProgress(ingestionRunId: string) {
    return await this.redisService.getIngestionProgress(ingestionRunId);
  }

  async abortCrawlJob(ingestionRunId: string): Promise<{ aborted: boolean }> {
    try {
      await Promise.all([
        this.sitesToScraperQueueProducer.setAbortFlag(ingestionRunId),
        this.sitesToScraperQueueProducer.drainJobsByIngestionRunId(
          ingestionRunId,
        ),
        this.ingestionRunRepository.markRunAsAborted(ingestionRunId),
      ]);
      return { aborted: true };
    } catch {
      return { aborted: false };
    }
  }

  // Certification CRUD methods
  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) {
      throw new BadRequestException(
        'Name must contain at least one alphanumeric character',
      );
    }
    return slug;
  }

  private toCertificationResponseDto(
    certification: Certification,
  ): AdminCertificationResponseDto {
    return {
      id: certification.id,
      name: certification.name,
      slug: certification.slug,
      filter_id: certification.filter_id,
      filter_name: certification.filter?.name,
      certifying_body: certification.certifying_body,
      description: certification.description,
      created_at: certification.created_at,
      updated_at: certification.updated_at,
    };
  }

  async getCertifications(
    searchQuery?: string,
  ): Promise<AdminCertificationResponseDto[]> {
    const certifications =
      await this.certificationRepository.findWithSearch(searchQuery);
    return certifications.map((cert) => this.toCertificationResponseDto(cert));
  }

  async createCertification(
    createDto: CreateCertificationDto,
  ): Promise<AdminCertificationResponseDto> {
    // Check if filter exists
    const filter = await this.filterRepository.findOne({
      where: { id: createDto.filter_id },
    });
    if (!filter) {
      throw new NotFoundException('Filter/Category not found');
    }

    // Check for duplicate name
    const existingCertification = await this.certificationRepository.findByName(
      createDto.name,
    );
    if (existingCertification) {
      throw new ConflictException(
        'Certification with this name already exists',
      );
    }

    // Create certification
    const certification = this.certificationRepository.create({
      name: createDto.name,
      slug: this.generateSlug(createDto.name),
      filter_id: createDto.filter_id,
      certifying_body: createDto.certifying_body || '',
      description: createDto.description,
    });

    const savedCertification =
      await this.certificationRepository.save(certification);
    return this.toCertificationResponseDto(savedCertification);
  }

  async updateCertification(
    id: string,
    updateDto: UpdateCertificationDto,
  ): Promise<AdminCertificationResponseDto> {
    // Check if certification exists
    const certification = await this.certificationRepository.findOne({
      where: { id },
    });
    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    // Check if filter exists (if filter_id is being updated)
    if (updateDto.filter_id) {
      const filter = await this.filterRepository.findOne({
        where: { id: updateDto.filter_id },
      });
      if (!filter) {
        throw new NotFoundException('Filter/Category not found');
      }
    }

    // Check for duplicate name (if name is being updated)
    if (updateDto.name) {
      const existingCertification =
        await this.certificationRepository.findByNameExcludingId(
          updateDto.name,
          id,
        );
      if (existingCertification) {
        throw new ConflictException(
          'Certification with this name already exists',
        );
      }
    }

    // Update certification
    const updateData: Partial<Certification> = {};
    if (updateDto.name) {
      updateData.name = updateDto.name;
      updateData.slug = this.generateSlug(updateDto.name);
    }
    if (updateDto.filter_id) updateData.filter_id = updateDto.filter_id;
    if (updateDto.certifying_body !== undefined)
      updateData.certifying_body = updateDto.certifying_body;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;

    await this.certificationRepository.update(id, updateData);

    const updatedCertification = await this.certificationRepository.findOne({
      where: { id },
    });
    if (!updatedCertification) {
      throw new NotFoundException('Certification not found after update');
    }
    return this.toCertificationResponseDto(updatedCertification);
  }

  async deleteCertification(id: string): Promise<void> {
    const certification = await this.certificationRepository.findOne({
      where: { id },
    });
    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    try {
      await this.certificationRepository.delete(id);
    } catch (error) {
      throw new BadRequestException(
        'Cannot delete certification. It may be associated with products.',
      );
    }
  }

  // Keyword CRUD methods
  private toKeywordResponseDto(
    keyword: FilterKeyword,
  ): AdminKeywordResponseDto {
    return {
      id: keyword.id,
      keyword: keyword.keyword,
      filter_id: keyword.filter_id,
      created_at: keyword.created_at,
      updated_at: keyword.updated_at,
    };
  }

  async createKeyword(
    createDto: CreateKeywordDto,
  ): Promise<AdminKeywordResponseDto> {
    // Check if filter exists
    const filter = await this.filterRepository.findOne({
      where: { id: createDto.filter_id },
    });
    if (!filter) {
      throw new NotFoundException('Filter/Category not found');
    }

    // Check for duplicate keyword in same filter
    const existingKeyword =
      await this.filterKeywordRepository.findByKeywordAndFilterId(
        createDto.keyword,
        createDto.filter_id,
      );
    if (existingKeyword) {
      throw new ConflictException(
        'Duplicate keyword already exists for this filter',
      );
    }

    // Create keyword
    const keyword = this.filterKeywordRepository.create({
      keyword: createDto.keyword,
      filter_id: createDto.filter_id,
    });

    const savedKeyword = await this.filterKeywordRepository.save(keyword);
    return this.toKeywordResponseDto(savedKeyword);
  }

  async updateKeyword(
    id: string,
    updateDto: UpdateKeywordDto,
  ): Promise<AdminKeywordResponseDto> {
    // Check if keyword exists
    const keyword = await this.filterKeywordRepository.findOne({
      where: { id },
    });
    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }

    // Check if filter exists (if filter_id is being updated)
    if (updateDto.filter_id) {
      const filter = await this.filterRepository.findOne({
        where: { id: updateDto.filter_id },
      });
      if (!filter) {
        throw new NotFoundException('Filter/Category not found');
      }
    }

    // Check for duplicate keyword (if keyword or filter_id is being updated)
    if (updateDto.keyword || updateDto.filter_id) {
      const checkKeyword = updateDto.keyword || keyword.keyword;
      const checkFilterId = updateDto.filter_id || keyword.filter_id;

      const existingKeyword =
        await this.filterKeywordRepository.findByKeywordAndFilterIdExcludingId(
          checkKeyword,
          checkFilterId,
          id,
        );
      if (existingKeyword) {
        throw new ConflictException(
          'Duplicate keyword already exists for this filter',
        );
      }
    }

    // Update keyword
    const updateData: Partial<FilterKeyword> = {};
    if (updateDto.keyword) updateData.keyword = updateDto.keyword;
    if (updateDto.filter_id) updateData.filter_id = updateDto.filter_id;

    await this.filterKeywordRepository.update(id, updateData);

    const updatedKeyword = await this.filterKeywordRepository.findOne({
      where: { id },
    });
    if (!updatedKeyword) {
      throw new NotFoundException('Keyword not found after update');
    }
    return this.toKeywordResponseDto(updatedKeyword);
  }

  async deleteKeyword(id: string): Promise<void> {
    const keyword = await this.filterKeywordRepository.findOne({
      where: { id },
    });
    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }

    await this.filterKeywordRepository.delete(id);
  }

  private async createFilterTxn(
    manager: EntityManager,
    dto: CreateFilterDto,
  ): Promise<Filter> {
    const slug = this.generateSlug(dto.name);

    const existing = await manager.getRepository(Filter).findOne({
      where: [{ name: dto.name }, { slug }],
    });
    if (existing) {
      throw new ConflictException('Filter with this name already exists');
    }

    const priority = (dto.tier as any) === FilterTier.PRIMARY ? 6 : 3;
    const filter = manager.getRepository(Filter).create({
      name: dto.name,
      slug,
      tier: dto.tier as any,
      description: dto.description ?? '',
      priority,
    });
    return manager.getRepository(Filter).save(filter);
  }

  private async updateFilterTxn(
    manager: EntityManager,
    id: string,
    dto: UpdateFilterDto,
  ): Promise<Filter> {
    const filter = await manager
      .getRepository(Filter)
      .findOne({ where: { id } });
    if (!filter) throw new NotFoundException(`Filter ${id} not found`);

    if (dto.name && dto.name !== filter.name) {
      const slug = this.generateSlug(dto.name);
      const existing = await manager.getRepository(Filter).findOne({
        where: [{ name: dto.name }, { slug }],
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Filter with this name already exists');
      }
      filter.name = dto.name;
      filter.slug = slug;
    }
    if (dto.tier !== undefined) {
      filter.tier = dto.tier as any;
      filter.priority = (dto.tier as any) === FilterTier.PRIMARY ? 6 : 3;
    }
    if (dto.description !== undefined) filter.description = dto.description;

    return manager.getRepository(Filter).save(filter);
  }

  private async deleteFilterTxn(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    const filter = await manager
      .getRepository(Filter)
      .findOne({ where: { id } });
    if (!filter) throw new NotFoundException(`Filter ${id} not found`);
    await manager.getRepository(Filter).remove(filter);
  }

  private async createKeywordTxn(
    manager: EntityManager,
    dto: CreateKeywordDto,
  ): Promise<FilterKeyword> {
    const filter = await manager.getRepository(Filter).findOne({
      where: { id: dto.filter_id },
    });
    if (!filter)
      throw new NotFoundException(`Filter ${dto.filter_id} not found`);

    const existing = await manager.getRepository(FilterKeyword).findOne({
      where: { keyword: dto.keyword, filter_id: dto.filter_id },
    });
    if (existing) {
      throw new ConflictException(
        'Duplicate keyword already exists for this filter',
      );
    }

    const keyword = manager.getRepository(FilterKeyword).create({
      keyword: dto.keyword,
      filter_id: dto.filter_id,
    });
    return manager.getRepository(FilterKeyword).save(keyword);
  }

  private async updateKeywordTxn(
    manager: EntityManager,
    id: string,
    dto: UpdateKeywordDto,
  ): Promise<FilterKeyword> {
    const keyword = await manager
      .getRepository(FilterKeyword)
      .findOne({ where: { id } });
    if (!keyword) throw new NotFoundException(`Keyword ${id} not found`);

    if (dto.filter_id) {
      const filter = await manager.getRepository(Filter).findOne({
        where: { id: dto.filter_id },
      });
      if (!filter)
        throw new NotFoundException(`Filter ${dto.filter_id} not found`);
    }

    if (dto.keyword || dto.filter_id) {
      const checkKeyword = dto.keyword ?? keyword.keyword;
      const checkFilterId = dto.filter_id ?? keyword.filter_id;
      const duplicate = await manager
        .getRepository(FilterKeyword)
        .createQueryBuilder('kw')
        .where('kw.keyword = :kw', { kw: checkKeyword })
        .andWhere('kw.filter_id = :fid', { fid: checkFilterId })
        .andWhere('kw.id != :id', { id })
        .getOne();
      if (duplicate) {
        throw new ConflictException(
          'Duplicate keyword already exists for this filter',
        );
      }
    }

    if (dto.keyword) keyword.keyword = dto.keyword;
    if (dto.filter_id) keyword.filter_id = dto.filter_id;

    return manager.getRepository(FilterKeyword).save(keyword);
  }

  private async deleteKeywordTxn(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    const keyword = await manager
      .getRepository(FilterKeyword)
      .findOne({ where: { id } });
    if (!keyword) throw new NotFoundException(`Keyword ${id} not found`);
    await manager.getRepository(FilterKeyword).remove(keyword);
  }

  private async createCertificationTxn(
    manager: EntityManager,
    dto: CreateCertificationDto,
  ): Promise<Certification> {
    const filter = await manager.getRepository(Filter).findOne({
      where: { id: dto.filter_id },
    });
    if (!filter)
      throw new NotFoundException(`Filter ${dto.filter_id} not found`);

    const existing = await manager.getRepository(Certification).findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        'Certification with this name already exists',
      );
    }

    const cert = manager.getRepository(Certification).create({
      name: dto.name,
      slug: this.generateSlug(dto.name),
      filter_id: dto.filter_id,
      certifying_body: dto.certifying_body ?? '',
      description: dto.description,
    });
    return manager.getRepository(Certification).save(cert);
  }

  private async updateCertificationTxn(
    manager: EntityManager,
    id: string,
    dto: UpdateCertificationDto,
  ): Promise<Certification> {
    const cert = await manager
      .getRepository(Certification)
      .findOne({ where: { id } });
    if (!cert) throw new NotFoundException(`Certification ${id} not found`);

    if (dto.filter_id) {
      const filter = await manager.getRepository(Filter).findOne({
        where: { id: dto.filter_id },
      });
      if (!filter)
        throw new NotFoundException(`Filter ${dto.filter_id} not found`);
    }

    if (dto.name) {
      const duplicate = await manager
        .getRepository(Certification)
        .createQueryBuilder('c')
        .where('c.name = :name', { name: dto.name })
        .andWhere('c.id != :id', { id })
        .getOne();
      if (duplicate) {
        throw new ConflictException(
          'Certification with this name already exists',
        );
      }
      cert.name = dto.name;
      cert.slug = this.generateSlug(dto.name);
    }
    if (dto.filter_id) cert.filter_id = dto.filter_id;
    if (dto.certifying_body !== undefined)
      cert.certifying_body = dto.certifying_body;
    if (dto.description !== undefined) cert.description = dto.description;

    return manager.getRepository(Certification).save(cert);
  }

  private async deleteCertificationTxn(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    const cert = await manager
      .getRepository(Certification)
      .findOne({ where: { id } });
    if (!cert) throw new NotFoundException(`Certification ${id} not found`);
    try {
      await manager.getRepository(Certification).remove(cert);
    } catch {
      throw new BadRequestException(
        'Cannot delete certification. It may be associated with products.',
      );
    }
  }

  async applyFilterSettings(
    dto: ApplyFilterSettingsDto,
  ): Promise<ApplyFilterSettingsResponseDto> {
    const results: AppliedOperationResultDto[] = [];
    let appliedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      const draftIdMap = new Map<string, string>();

      const resolve = (ref: string | undefined): string | undefined => {
        if (!ref) return undefined;
        return draftIdMap.get(ref) ?? ref;
      };

      for (let i = 0; i < dto.operations.length; i++) {
        const op = dto.operations[i];

        const resolvedId = resolve(op.id);
        const resolvedFilterId = resolve(op.filter_id);

        let resultId: string | undefined;

        switch (`${op.type}:${op.model_type}`) {
          case `${ApplyOperationType.CREATE}:${ApplyModelType.FILTER}`: {
            const filter = await this.createFilterTxn(manager, {
              name: op.name!,
              tier: op.tier! as FilterTier,
              description: op.description!,
            });
            resultId = filter.id;
            if (op.draft_id) draftIdMap.set(op.draft_id, filter.id);
            break;
          }
          case `${ApplyOperationType.EDIT}:${ApplyModelType.FILTER}`: {
            const filter = await this.updateFilterTxn(manager, resolvedId!, {
              name: op.name,
              tier: op.tier! as FilterTier,
              description: op.description,
            });
            resultId = filter.id;
            break;
          }
          case `${ApplyOperationType.DELETE}:${ApplyModelType.FILTER}`: {
            await this.deleteFilterTxn(manager, resolvedId!);
            break;
          }

          // ---- Keyword ----
          case `${ApplyOperationType.CREATE}:${ApplyModelType.KEYWORD}`: {
            const keyword = await this.createKeywordTxn(manager, {
              keyword: op.keyword!,
              filter_id: resolvedFilterId!,
            });
            resultId = keyword.id;
            if (op.draft_id) draftIdMap.set(op.draft_id, keyword.id);
            break;
          }
          case `${ApplyOperationType.EDIT}:${ApplyModelType.KEYWORD}`: {
            const keyword = await this.updateKeywordTxn(manager, resolvedId!, {
              keyword: op.keyword,
              filter_id: resolvedFilterId,
            });
            resultId = keyword.id;
            break;
          }
          case `${ApplyOperationType.DELETE}:${ApplyModelType.KEYWORD}`: {
            await this.deleteKeywordTxn(manager, resolvedId!);
            break;
          }

          // ---- Certification ----
          case `${ApplyOperationType.CREATE}:${ApplyModelType.CERTIFICATION}`: {
            const cert = await this.createCertificationTxn(manager, {
              name: op.name!,
              filter_id: resolvedFilterId!,
              certifying_body: op.certifying_body,
              description: op.description,
            });
            resultId = cert.id;
            if (op.draft_id) draftIdMap.set(op.draft_id, cert.id);
            break;
          }
          case `${ApplyOperationType.EDIT}:${ApplyModelType.CERTIFICATION}`: {
            const cert = await this.updateCertificationTxn(
              manager,
              resolvedId!,
              {
                name: op.name,
                filter_id: resolvedFilterId,
                certifying_body: op.certifying_body,
                description: op.description,
              },
            );
            resultId = cert.id;
            break;
          }
          case `${ApplyOperationType.DELETE}:${ApplyModelType.CERTIFICATION}`: {
            await this.deleteCertificationTxn(manager, resolvedId!);
            break;
          }

          default:
            throw new BadRequestException(
              `Unknown operation type "${op.type}" on model "${op.model_type}"`,
            );
        }

        results.push({
          operation_index: i,
          type: op.type,
          model_type: op.model_type,
          success: true,
          id: resultId,
          draft_id: op.draft_id,
        });
        appliedCount++;
      }
    });

    return {
      applied_count: appliedCount,
      total_count: dto.operations.length,
      results,
    };
  }

  async getDiscoveryStats(): Promise<DiscoveryStatsResponseDto> {
    const stats = await this.siteToReviewRepository.getStats();
    const activeJobs =
      await this.sitesToDiscoverQueueProducerService.getJobsByStatus('active'); // there will be only one active job at a time

    return {
      ...stats,
      currentJobId: activeJobs?.[0]?.id,
    };
  }

  async getDiscoveryResults(
    query: DiscoveryResultsQueryDto,
  ): Promise<DiscoveryResultsResponseDto> {
    const { page = 1, limit = 20, status } = query;
    const { items, total } = await this.siteToReviewRepository.findPaginated(
      page,
      limit,
      status,
    );
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async removeDiscoveryResult(id: string): Promise<void> {
    const result = await this.siteToReviewRepository.findOne({
      where: { id },
    });
    if (!result) {
      throw new NotFoundException('Discovery result not found');
    }
    await this.siteToReviewRepository.softRemove(result);
  }

  async triggerDiscoveryRun(
    triggeredBy = 'admin',
  ): Promise<TriggerDiscoveryResponseDto> {
    const domainsToExclude: string[] = [];
    const discoveryResults = await this.siteToReviewRepository.find({
      select: ['domain'],
      withDeleted: true,
    });
    const brands = await this.brandRepository.find({ select: ['website_url'] });
    discoveryResults.forEach((result) => {
      if (result.domain) {
        domainsToExclude.push(result.domain);
      }
    });
    brands.forEach((brand) => {
      if (brand.website_url) {
        try {
          const url = new URL(brand.website_url);
          domainsToExclude.push(url.hostname);
        } catch (e) {
          console.warn(
            `Invalid URL for brand ${brand.id}: ${brand.website_url}`,
          );
        }
      }
    });

    const settings = await this.generalSettingsRepository.getSettings();
    const jobId =
      await this.sitesToDiscoverQueueProducerService.addDiscoveryJob({
        maxQueries: settings?.discovery_max_queries ?? 10,
        excludedDomains: domainsToExclude,
        triggeredBy,
      });
    return { message: 'Discovery run triggered successfully', jobId };
  }

  async getDiscoveryRunStatus(
    jobId: string,
  ): Promise<DiscoveryRunStatusResponseDto> {
    const status =
      await this.sitesToDiscoverQueueProducerService.getJobDetails(jobId);
    if (!status) {
      throw new NotFoundException('Discovery run not found');
    }
    return status;
  }

  async stopDiscoveryRun(jobId: string): Promise<{ stopped: boolean }> {
    return this.sitesToDiscoverQueueProducerService.stopDiscovery(jobId);
  }
}
