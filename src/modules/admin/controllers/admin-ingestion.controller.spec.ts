import { Test, TestingModule } from '@nestjs/testing';
import { AdminIngestionController } from './admin-ingestion.controller';
import { AdminService } from '../services/admin.service';
import { BrandsIngestionQueryDto } from '../../ingestion/dto/brands-ingestion-query.dto';
import { BrandsIngestionResponseDto } from '../../ingestion/dto/brands-ingestion-response.dto';
import {
  BrandIngestionDownloadQueryDto,
  DownloadFormat,
} from '../dto/brand-ingestion-download.dto';
import { RerunIngestionDto, IngestionMode } from '../dto/rerun-ingestion.dto';
import { RerunIngestionResponseDto } from '../dto/rerun-ingestion-response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

describe('AdminIngestionController', () => {
  let controller: AdminIngestionController;

  const mockBrandsIngestionResponse: BrandsIngestionResponseDto = {
    logs: [
      {
        brand_id: '123e4567-e89b-12d3-a456-426614174000',
        source_name: 'Test Brand',
        status: 'completed',
        products_ingested: 100,
        products_excluded: 5,
        products_updated: 10,
        last_run: new Date('2024-01-01T00:00:00.000Z'),
        errors: JSON.stringify([
          {
            message: 'Error message example',
            timestamp: new Date('2024-01-01T00:00:00.000Z'),
          },
        ]),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockAdminService = {
    getBrandsIngestionLogs: jest.fn(),
    downloadBrandIngestionLog: jest.fn(),
    getIngestionStats: jest.fn(),
    rerunBrandIngestion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminIngestionController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: AdminRoleGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: AdminGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get<AdminIngestionController>(AdminIngestionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBrandsIngestionLogs', () => {
    it('should return brands ingestion logs', async () => {
      const query: BrandsIngestionQueryDto = {
        page: 1,
        limit: 10,
      };

      mockAdminService.getBrandsIngestionLogs.mockResolvedValue(
        mockBrandsIngestionResponse,
      );

      const result = await controller.getBrandsIngestionLogs(query);

      expect(mockAdminService.getBrandsIngestionLogs).toHaveBeenCalledWith(
        query,
      );
      expect(result).toEqual(mockBrandsIngestionResponse);
    });

    it('should propagate service errors', async () => {
      const query: BrandsIngestionQueryDto = {
        page: 1,
        limit: 10,
      };
      const errorMessage = 'Service error';

      mockAdminService.getBrandsIngestionLogs.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getBrandsIngestionLogs(query)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('downloadBrandIngestionLog', () => {
    it('should download brand ingestion log', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      const query: BrandIngestionDownloadQueryDto = {
        format: DownloadFormat.JSON,
      };
      const mockResponse = {} as Response;

      mockAdminService.downloadBrandIngestionLog.mockResolvedValue(undefined);

      await controller.downloadBrandIngestionLog(brandId, query, mockResponse);

      expect(mockAdminService.downloadBrandIngestionLog).toHaveBeenCalledWith(
        brandId,
        DownloadFormat.JSON,
        mockResponse,
      );
    });

    it('should propagate service errors', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      const query: BrandIngestionDownloadQueryDto = {
        format: DownloadFormat.CSV,
      };
      const mockResponse = {} as Response;
      const errorMessage = 'Service error';

      mockAdminService.downloadBrandIngestionLog.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.downloadBrandIngestionLog(brandId, query, mockResponse),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getIngestionStats', () => {
    it('should return ingestion statistics', async () => {
      const mockStats = {
        total_sources: 5,
        products_ingested: {
          total: 1250,
          today: 45,
          change_percentage: 12.5,
        },
        failed_ingestions: 3,
        products_excluded: 28,
      };

      mockAdminService.getIngestionStats.mockResolvedValue(mockStats);

      const result = await controller.getIngestionStats();

      expect(mockAdminService.getIngestionStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Database error';

      mockAdminService.getIngestionStats.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getIngestionStats()).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('rerunBrandIngestion', () => {
    const brandId = '123e4567-e89b-12d3-a456-426614174000';
    const mockRerunResponse: RerunIngestionResponseDto = {
      ingestion_run_id: 'run-123',
      status: 'standby',
      mode: 'full',
    };

    it('should successfully trigger brand ingestion rerun', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };

      mockAdminService.rerunBrandIngestion.mockResolvedValue(mockRerunResponse);

      const result = await controller.rerunBrandIngestion(brandId, rerunDto);

      expect(mockAdminService.rerunBrandIngestion).toHaveBeenCalledWith(
        brandId,
        rerunDto,
      );
      expect(result).toEqual(mockRerunResponse);
    });

    it('should handle incremental mode', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.INCREMENTAL,
      };
      const incrementalResponse = {
        ...mockRerunResponse,
        mode: 'incremental',
      };

      mockAdminService.rerunBrandIngestion.mockResolvedValue(
        incrementalResponse,
      );

      const result = await controller.rerunBrandIngestion(brandId, rerunDto);

      expect(result.mode).toBe('incremental');
    });

    it('should propagate NotFoundException when brand not found', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };

      mockAdminService.rerunBrandIngestion.mockRejectedValue(
        new NotFoundException('Brand not found'),
      );

      await expect(
        controller.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException for inactive brand', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };

      mockAdminService.rerunBrandIngestion.mockRejectedValue(
        new BadRequestException('Brand is not active'),
      );

      await expect(
        controller.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate HttpException for rate limiting', async () => {
      const rerunDto: RerunIngestionDto = {
        mode: IngestionMode.FULL,
      };

      mockAdminService.rerunBrandIngestion.mockRejectedValue(
        new HttpException(
          'Rate limit exceeded - max 1 rerun per hour',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(
        controller.rerunBrandIngestion(brandId, rerunDto),
      ).rejects.toThrow(HttpException);
    });
  });
});
