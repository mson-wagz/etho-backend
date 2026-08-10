import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FilterService } from '../../filters/filters.service';
import { IngestionService } from '../../ingestion/ingestion.service';
import { BrandRepository } from '../../../repository/brand.repository';
import { IngestionRunRepository } from '../../../repository/ingestion-run.repository';
import { GeneralSettingsRepository } from '../../../repository/general-settings.repository';
import { CertificationRepository } from '../../../repository/certification.repository';
import { FilterRepository } from '../../../repository/filter.repository';
import { FilterKeywordRepository } from '../../../repository/filter-keyword.repository';
import { ScrapingSourceRepository } from '../../../repository/scraping-source.repository';
import { ProductRepository } from '../../../repository/product.repository';
import { DownloadFormat } from '../dto/brand-ingestion-download.dto';
import { RerunIngestionDto, IngestionMode } from '../dto/rerun-ingestion.dto';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { CreateKeywordDto } from '../dto/create-keyword.dto';
import { UpdateKeywordDto } from '../dto/update-keyword.dto';
import { SitesToScraperQueueProducerService } from '../../queue/queues/sitesToScraperQueueProducer.service';
import { SitesToConfigureQueueProducerService } from '../../queue/queues/sitesToConfigureQueueProducer.service';
import {
  IngestionRunType,
  IngestionStatus,
} from '../../../common/enums/ingestion.enum';
import { Response } from 'express';
import { AnalyticsEventService } from '../../analytics-event/analytics-event.service';
import { PeriodUnit } from '../../../entities/general-settings.entity';
import { ProductsService } from '../../products/products.service';

describe('AdminService', () => {
  let service: AdminService;
  let brandRepository: jest.Mocked<BrandRepository>;
  let ingestionRunRepository: jest.Mocked<IngestionRunRepository>;
  let generalSettingsRepository: jest.Mocked<GeneralSettingsRepository>;
  let certificationRepository: jest.Mocked<CertificationRepository>;
  let filterRepository: jest.Mocked<FilterRepository>;
  let filterKeywordRepository: jest.Mocked<FilterKeywordRepository>;
  let sitesToScraperQueueProducer: jest.Mocked<SitesToScraperQueueProducerService>;
  let mockResponse: jest.Mocked<Response>;

  const mockBrand = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Brand',
    website_url: 'https://testbrand.com',
    last_scraped_at: new Date('2024-01-01T00:00:00.000Z'),
    scrape_status: 'completed',
    ingestion_runs: [
      {
        id: 'run-123',
        run_type: 'full',
        status: 'completed',
        products_fetched: 100,
        products_added: 50,
        products_updated: 30,
        products_excluded: 20,
        errors_count: 0,
        errors: null,
        started_at: new Date('2024-01-01T10:00:00.000Z'),
        completed_at: new Date('2024-01-01T11:00:00.000Z'),
        duration_seconds: 3600,
      },
    ],
  } as any;

  beforeEach(async () => {
    mockResponse = {
      setHeader: jest.fn(),
      json: jest.fn(),
      send: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: FilterService,
          useValue: { getAdminFilterSettings: jest.fn() },
        },
        {
          provide: IngestionService,
          useValue: { getBrandsIngestionLogs: jest.fn() },
        },
        {
          provide: BrandRepository,
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: ScrapingSourceRepository,
          useValue: {},
        },
        {
          provide: IngestionRunRepository,
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: GeneralSettingsRepository,
          useValue: {
            getSettings: jest.fn(),
            updateSettings: jest.fn(),
          },
        },
        {
          provide: CertificationRepository,
          useValue: {
            findWithSearch: jest.fn(),
            findOne: jest.fn(),
            findByName: jest.fn(),
            findByNameExcludingId: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: FilterRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: FilterKeywordRepository,
          useValue: {
            findOne: jest.fn(),
            findByKeywordAndFilterId: jest.fn(),
            findByKeywordAndFilterIdExcludingId: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AnalyticsEventService,
          useValue: {},
        },
        {
          provide: ProductsService,
          useValue: {},
        },
        {
          provide: SitesToScraperQueueProducerService,
          useValue: {
            addCrawlJob: jest.fn(),
          },
        },
        {
          provide: SitesToConfigureQueueProducerService,
          useValue: {},
        },
        {
          provide: ProductRepository,
          useValue: {
            deleteProductsWithRelations: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    brandRepository = module.get(BrandRepository);
    ingestionRunRepository = module.get(IngestionRunRepository);
    generalSettingsRepository = module.get(GeneralSettingsRepository);
    certificationRepository = module.get(CertificationRepository);
    filterRepository = module.get(FilterRepository);
    filterKeywordRepository = module.get(FilterKeywordRepository);
    sitesToScraperQueueProducer = module.get(
      SitesToScraperQueueProducerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('downloadBrandIngestionLog', () => {
    it('should throw NotFoundException when brand not found', async () => {
      brandRepository.findOne.mockResolvedValue(null);

      await expect(
        service.downloadBrandIngestionLog(
          'non-existent-id',
          DownloadFormat.JSON,
          mockResponse,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate JSON download', async () => {
      brandRepository.findOne.mockResolvedValue(mockBrand);

      await service.downloadBrandIngestionLog(
        '123e4567-e89b-12d3-a456-426614174000',
        DownloadFormat.JSON,
        mockResponse,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: expect.objectContaining({ id: mockBrand.id }),
          ingestion_runs: expect.any(Array),
          total_runs: 1,
        }),
      );
    });

    it('should generate CSV download', async () => {
      brandRepository.findOne.mockResolvedValue(mockBrand);

      await service.downloadBrandIngestionLog(
        '123e4567-e89b-12d3-a456-426614174000',
        DownloadFormat.CSV,
        mockResponse,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('Run ID'),
      );
    });
  });

  describe('getIngestionStats', () => {
    it('should return ingestion statistics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      brandRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      ingestionRunRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ count: '5' })
        .mockResolvedValueOnce({ total: '1250' })
        .mockResolvedValueOnce({ total: '45' })
        .mockResolvedValueOnce({ total: '40' })
        .mockResolvedValueOnce({ count: '3' })
        .mockResolvedValueOnce({ total: '28' });

      const result = await service.getIngestionStats();

      expect(result).toEqual({
        total_sources: 5,
        products_ingested: {
          total: 1250,
          today: 45,
          change_percentage: 12.5,
        },
        failed_ingestions: 3,
        products_excluded: 28,
      });
    });

    it('should handle null values gracefully', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };

      brandRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      ingestionRunRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getIngestionStats();

      expect(result).toEqual({
        total_sources: 0,
        products_ingested: {
          total: 0,
          today: 0,
          change_percentage: 0,
        },
        failed_ingestions: 0,
        products_excluded: 0,
      });
    });
  });

  describe('getGeneralSettings', () => {
    it('should return general settings', async () => {
      const mockSettings = {
        scraping_frequency: 1,
        scraping_frequency_period_value: 3,
        scraping_frequency_period_unit: PeriodUnit.DAYS,
      };
      generalSettingsRepository.getSettings.mockResolvedValue(
        mockSettings as any,
      );

      const result = await service.getGeneralSettings();

      expect(result).toEqual(mockSettings);
    });

    it('should auto-create settings when not found', async () => {
      const defaultSettings = {
        scraping_frequency: 0,
        scraping_frequency_period_value: 1,
        scraping_frequency_period_unit: PeriodUnit.DAYS,
      };
      generalSettingsRepository.getSettings.mockResolvedValue(null);
      generalSettingsRepository.updateSettings.mockResolvedValue(
        defaultSettings as any,
      );

      const result = await service.getGeneralSettings();

      await expect(service.getGeneralSettings()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      const updateDto = {
        scraping_frequency: 2,
        scraping_frequency_period_value: 5,
        scraping_frequency_period_unit: PeriodUnit.WEEKS,
      };
      generalSettingsRepository.updateSettings.mockResolvedValue(
        updateDto as any,
      );

      const result = await service.updateGeneralSettings(updateDto);

      expect(generalSettingsRepository.updateSettings).toHaveBeenCalledWith(
        updateDto,
      );
      expect(result).toEqual(updateDto);
    });

    it('should propagate errors from repository', async () => {
      const updateDto = {
        scraping_frequency: 2,
        scraping_frequency_period_value: 5,
        scraping_frequency_period_unit: PeriodUnit.WEEKS,
      };
      const error = new Error('Database error');
      generalSettingsRepository.updateSettings.mockRejectedValue(error);

      await expect(service.updateGeneralSettings(updateDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('rerunBrandIngestion', () => {
    const brandId = '123e4567-e89b-12d3-a456-426614174000';
    const mockBrand = {
      id: brandId,
      name: 'Test Brand',
      scrape_status: null,
    };
    const mockIngestionRun = {
      id: 'run-123',
      brand_id: brandId,
      run_type: IngestionRunType.MANUAL,
      status: IngestionStatus.STANDBY,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully create ingestion run and queue job', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };

      brandRepository.findOne.mockResolvedValue(mockBrand as any);
      ingestionRunRepository.findOne
        .mockResolvedValueOnce(null) // No pending run
        .mockResolvedValueOnce(null); // No recent run
      ingestionRunRepository.create.mockReturnValue(mockIngestionRun as any);
      ingestionRunRepository.save.mockResolvedValue(mockIngestionRun as any);
      sitesToScraperQueueProducer.addCrawlJob.mockResolvedValue('job-123');

      const result = await service.rerunBrandIngestion(brandId, rerunDto);

      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { id: brandId },
      });
      expect(ingestionRunRepository.create).toHaveBeenCalledWith({
        brand_id: brandId,
        run_type: IngestionRunType.MANUAL,
        status: IngestionStatus.STANDBY,
      });
      expect(ingestionRunRepository.save).toHaveBeenCalledWith(
        mockIngestionRun,
      );
      expect(sitesToScraperQueueProducer.addCrawlJob).toHaveBeenCalledWith(
        'Test Brand',
        {
          triggeredBy: 'admin-rerun',
          priority: 2,
          brand_id: brandId,
          ingestion_run_id: 'run-123',
          ingestion_mode: 'full',
        },
      );
      expect(result).toEqual({
        ingestion_run_id: 'run-123',
        status: 'standby',
        mode: 'full',
      });
    });

    it('should use lower priority for incremental mode', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.INCREMENTAL,
      };

      brandRepository.findOne.mockResolvedValue(mockBrand as any);
      ingestionRunRepository.findOne
        .mockResolvedValueOnce(null) // No pending run
        .mockResolvedValueOnce(null); // No recent run
      ingestionRunRepository.create.mockReturnValue(mockIngestionRun as any);
      ingestionRunRepository.save.mockResolvedValue(mockIngestionRun as any);
      sitesToScraperQueueProducer.addCrawlJob.mockResolvedValue('job-123');

      await service.rerunBrandIngestion(brandId, rerunDto);

      expect(sitesToScraperQueueProducer.addCrawlJob).toHaveBeenCalledWith(
        'Test Brand',
        expect.objectContaining({
          priority: 1,
          ingestion_mode: 'incremental',
        }),
      );
    });

    it('should throw NotFoundException when brand not found', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };

      brandRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(NotFoundException);
      expect(ingestionRunRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for inactive brand', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };
      const inactiveBrand = {
        ...mockBrand,
        scrape_status: 'inactive',
      };

      brandRepository.findOne.mockResolvedValue(inactiveBrand as any);

      await expect(
        service.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(BadRequestException);
      expect(ingestionRunRepository.create).not.toHaveBeenCalled();
    });

    it('should throw HttpException for pending run', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };
      const pendingRun = {
        id: 'pending-run',
        status: IngestionStatus.STANDBY,
      };

      brandRepository.findOne.mockResolvedValue(mockBrand as any);
      ingestionRunRepository.findOne.mockResolvedValueOnce(pendingRun as any);

      await expect(
        service.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(HttpException);
      expect(ingestionRunRepository.create).not.toHaveBeenCalled();
    });

    it('should throw HttpException for rate limiting', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };
      const recentRun = {
        id: 'recent-run',
        started_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      };

      brandRepository.findOne.mockResolvedValue(mockBrand as any);
      ingestionRunRepository.findOne
        .mockResolvedValueOnce(null) // No pending run
        .mockResolvedValueOnce(recentRun as any); // Recent run

      await expect(
        service.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(HttpException);
      expect(ingestionRunRepository.create).not.toHaveBeenCalled();
    });

    it('should allow rerun after rate limit period', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };
      const oldRun = {
        id: 'old-run',
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };

      brandRepository.findOne.mockResolvedValue(mockBrand as any);
      ingestionRunRepository.findOne
        .mockResolvedValueOnce(null) // No pending run
        .mockResolvedValueOnce(oldRun as any); // Old run
      ingestionRunRepository.create.mockReturnValue(mockIngestionRun as any);
      ingestionRunRepository.save.mockResolvedValue(mockIngestionRun as any);
      sitesToScraperQueueProducer.addCrawlJob.mockResolvedValue('job-123');

      const result = await service.rerunBrandIngestion(brandId, rerunDto);

      expect(result.ingestion_run_id).toBe('run-123');
      expect(ingestionRunRepository.create).toHaveBeenCalled();
    });

    it('should mark run as failed if queue job fails', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };
      const queueError = new Error('Queue connection failed');

      brandRepository.findOne.mockResolvedValue(mockBrand as any);
      ingestionRunRepository.findOne
        .mockResolvedValueOnce(null) // No pending run
        .mockResolvedValueOnce(null); // No recent run
      ingestionRunRepository.create.mockReturnValue(mockIngestionRun as any);
      ingestionRunRepository.save.mockResolvedValue(mockIngestionRun as any);
      ingestionRunRepository.update.mockResolvedValue({} as any);
      sitesToScraperQueueProducer.addCrawlJob.mockRejectedValue(queueError);

      await expect(
        service.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(queueError);

      expect(ingestionRunRepository.update).toHaveBeenCalledWith('run-123', {
        status: IngestionStatus.FAILED,
      });
    });
  });

  describe('Certification CRUD', () => {
    const mockCertification = {
      id: 'cert-123',
      name: 'GOTS',
      slug: 'gots',
      filter_id: 'filter-123',
      certifying_body: 'Global Organic Textile Standard',
      description: 'Organic textile certification',
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    };

    const mockFilter = {
      id: 'filter-123',
      name: 'Organic',
    };

    describe('getCertifications', () => {
      it('should return certifications with optional search', async () => {
        certificationRepository.findWithSearch.mockResolvedValue([
          mockCertification,
        ] as any);

        const result = await service.getCertifications('gots');

        expect(certificationRepository.findWithSearch).toHaveBeenCalledWith(
          'gots',
        );
        expect(result).toHaveLength(1);
      });
    });

    describe('createCertification', () => {
      const createDto: CreateCertificationDto = {
        name: 'GOTS',
        filter_id: 'filter-123',
        certifying_body: 'Global Organic Textile Standard',
        description: 'Organic textile certification',
      };

      it('should create certification successfully', async () => {
        filterRepository.findOne.mockResolvedValue(mockFilter as any);
        certificationRepository.findByName.mockResolvedValue(null);
        certificationRepository.create.mockReturnValue(
          mockCertification as any,
        );
        certificationRepository.save.mockResolvedValue(
          mockCertification as any,
        );

        const result = await service.createCertification(createDto);

        expect(certificationRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'GOTS', slug: 'gots' }),
        );
        expect(result).toEqual(mockCertification);
      });

      it('should throw NotFoundException when filter not found', async () => {
        filterRepository.findOne.mockResolvedValue(null);

        await expect(service.createCertification(createDto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ConflictException when certification name exists', async () => {
        filterRepository.findOne.mockResolvedValue(mockFilter as any);
        certificationRepository.findByName.mockResolvedValue(
          mockCertification as any,
        );

        await expect(service.createCertification(createDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('updateCertification', () => {
      const updateDto: UpdateCertificationDto = {
        name: 'Updated GOTS',
      };

      it('should update certification successfully', async () => {
        certificationRepository.findOne
          .mockResolvedValueOnce(mockCertification as any)
          .mockResolvedValueOnce({ ...mockCertification, ...updateDto } as any);
        certificationRepository.findByNameExcludingId.mockResolvedValue(null);
        certificationRepository.update.mockResolvedValue({} as any);

        const result = await service.updateCertification('cert-123', updateDto);

        expect(certificationRepository.update).toHaveBeenCalledWith(
          'cert-123',
          expect.objectContaining({
            name: 'Updated GOTS',
            slug: 'updated-gots',
          }),
        );
        expect(result.name).toBe('Updated GOTS');
      });

      it('should throw NotFoundException when certification not found', async () => {
        certificationRepository.findOne.mockResolvedValue(null);

        await expect(
          service.updateCertification('invalid-id', updateDto),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ConflictException when name already exists', async () => {
        certificationRepository.findOne.mockResolvedValue(
          mockCertification as any,
        );
        certificationRepository.findByNameExcludingId.mockResolvedValue({
          id: 'other',
        } as any);

        await expect(
          service.updateCertification('cert-123', updateDto),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('deleteCertification', () => {
      it('should delete certification successfully', async () => {
        certificationRepository.findOne.mockResolvedValue(
          mockCertification as any,
        );
        certificationRepository.delete.mockResolvedValue({} as any);

        await service.deleteCertification('cert-123');

        expect(certificationRepository.delete).toHaveBeenCalledWith('cert-123');
      });

      it('should throw NotFoundException when certification not found', async () => {
        certificationRepository.findOne.mockResolvedValue(null);

        await expect(service.deleteCertification('invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('Keyword CRUD', () => {
    const mockKeyword = {
      id: 'keyword-123',
      keyword: 'organic',
      filter_id: 'filter-123',
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    };

    const mockFilter = {
      id: 'filter-123',
      name: 'Sustainability',
    };

    describe('createKeyword', () => {
      const createDto: CreateKeywordDto = {
        keyword: 'organic',
        filter_id: 'filter-123',
      };

      it('should create keyword successfully', async () => {
        filterRepository.findOne.mockResolvedValue(mockFilter as any);
        filterKeywordRepository.findByKeywordAndFilterId.mockResolvedValue(
          null,
        );
        filterKeywordRepository.create.mockReturnValue(mockKeyword as any);
        filterKeywordRepository.save.mockResolvedValue(mockKeyword as any);

        const result = await service.createKeyword(createDto);

        expect(filterKeywordRepository.create).toHaveBeenCalledWith({
          keyword: 'organic',
          filter_id: 'filter-123',
        });
        expect(result).toEqual(mockKeyword);
      });

      it('should throw NotFoundException when filter not found', async () => {
        filterRepository.findOne.mockResolvedValue(null);

        await expect(service.createKeyword(createDto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ConflictException when duplicate keyword exists', async () => {
        filterRepository.findOne.mockResolvedValue(mockFilter as any);
        filterKeywordRepository.findByKeywordAndFilterId.mockResolvedValue(
          mockKeyword as any,
        );

        await expect(service.createKeyword(createDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('updateKeyword', () => {
      const updateDto: UpdateKeywordDto = {
        keyword: 'sustainable',
      };

      it('should update keyword successfully', async () => {
        filterKeywordRepository.findOne
          .mockResolvedValueOnce(mockKeyword as any)
          .mockResolvedValueOnce({
            ...mockKeyword,
            keyword: 'sustainable',
          } as any);
        filterKeywordRepository.findByKeywordAndFilterIdExcludingId.mockResolvedValue(
          null,
        );
        filterKeywordRepository.update.mockResolvedValue({} as any);

        const result = await service.updateKeyword('keyword-123', updateDto);

        expect(filterKeywordRepository.update).toHaveBeenCalledWith(
          'keyword-123',
          { keyword: 'sustainable' },
        );
        expect(result.keyword).toBe('sustainable');
      });

      it('should throw NotFoundException when keyword not found', async () => {
        filterKeywordRepository.findOne.mockResolvedValue(null);

        await expect(
          service.updateKeyword('invalid-id', updateDto),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ConflictException when duplicate keyword exists', async () => {
        filterKeywordRepository.findOne.mockResolvedValue(mockKeyword as any);
        filterKeywordRepository.findByKeywordAndFilterIdExcludingId.mockResolvedValue(
          { id: 'other' } as any,
        );

        await expect(
          service.updateKeyword('keyword-123', updateDto),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('deleteKeyword', () => {
      it('should delete keyword successfully', async () => {
        filterKeywordRepository.findOne.mockResolvedValue(mockKeyword as any);
        filterKeywordRepository.delete.mockResolvedValue({} as any);

        await service.deleteKeyword('keyword-123');

        expect(filterKeywordRepository.delete).toHaveBeenCalledWith(
          'keyword-123',
        );
      });

      it('should throw NotFoundException when keyword not found', async () => {
        filterKeywordRepository.findOne.mockResolvedValue(null);

        await expect(service.deleteKeyword('invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
