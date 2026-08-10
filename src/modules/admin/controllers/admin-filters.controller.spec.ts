import { Test, TestingModule } from '@nestjs/testing';
import { AdminFiltersController } from './admin-filters.controller';
import { AdminService } from '../services/admin.service';
import { AdminFilterSettingsResponseDto } from '../dto/admin-filter-settings.dto';
import { CreateFilterDto } from '../dto/create-filter.dto';
import { UpdateFilterDto } from '../dto/update-filter.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { Filter, FilterTier } from '../../../entities/filter.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AdminFiltersController', () => {
  let controller: AdminFiltersController;

  const mockAdminFilterSettingsResponse: AdminFilterSettingsResponseDto = {
    filters: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Small Business',
        slug: 'small-business',
        tier: 'secondary',
        description: 'Independently owned and operated on a small scale',
        priority: 6,
        certifications: [
          {
            id: 'cert-123',
            name: 'SBA Small Business Certification',
            slug: 'sba-small-business-certification',
            certifying_body: 'US SBA',
            description: 'This is the SBA Small Business Certification',
          },
        ],
        keywords: [
          {
            id: 'keyword-123',
            keyword: 'small business',
          },
        ],
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
      },
    ],
    counts: {
      total_filters: 1,
      total_certifications: 1,
      total_keywords: 1,
    },
  };

  const mockAdminService = {
    getFilterSettings: jest.fn(),
    createFilter: jest.fn(),
    updateFilter: jest.fn(),
    deleteFilter: jest.fn(),
  };

  const mockFilter: Filter = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Filter',
    slug: 'test-filter',
    tier: FilterTier.PRIMARY,
    description: 'Test filter description',
    priority: 6,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    keywords: [],
    certifications: [],
    product_filters: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFiltersController],
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

    controller = module.get<AdminFiltersController>(AdminFiltersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminFilterSettings', () => {
    it('should return admin filter settings without category filter', async () => {
      mockAdminService.getFilterSettings.mockResolvedValue(
        mockAdminFilterSettingsResponse,
      );

      const result = await controller.getAdminFilterSettings();

      expect(mockAdminService.getFilterSettings).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result).toEqual(mockAdminFilterSettingsResponse);
    });

    it('should return admin filter settings with search query', async () => {
      mockAdminService.getFilterSettings.mockResolvedValue(
        mockAdminFilterSettingsResponse,
      );

      const result = await controller.getAdminFilterSettings(
        undefined,
        'organic',
      );

      expect(mockAdminService.getFilterSettings).toHaveBeenCalledWith(
        undefined,
        'organic',
      );
      expect(result).toEqual(mockAdminFilterSettingsResponse);
    });

    it('should return admin filter settings with both category and search', async () => {
      mockAdminService.getFilterSettings.mockResolvedValue(
        mockAdminFilterSettingsResponse,
      );

      const result = await controller.getAdminFilterSettings(
        'Small Business',
        'organic',
      );

      expect(mockAdminService.getFilterSettings).toHaveBeenCalledWith(
        'Small Business',
        'organic',
      );
      expect(result).toEqual(mockAdminFilterSettingsResponse);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Service error';
      mockAdminService.getFilterSettings.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.getAdminFilterSettings('Small Business'),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('createFilter', () => {
    const createFilterDto: CreateFilterDto = {
      name: 'Test Filter',
      tier: FilterTier.PRIMARY,
      description: 'Test filter description',
    };

    it('should create a filter successfully', async () => {
      mockAdminService.createFilter.mockResolvedValue(mockFilter);

      const result = await controller.createFilter(createFilterDto);

      expect(mockAdminService.createFilter).toHaveBeenCalledWith(
        createFilterDto,
      );
      expect(result).toEqual(mockFilter);
    });

    it('should handle conflict when filter name exists', async () => {
      mockAdminService.createFilter.mockRejectedValue(
        new ConflictException('Filter with this name already exists'),
      );

      await expect(controller.createFilter(createFilterDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateFilter', () => {
    const updateFilterDto: UpdateFilterDto = {
      name: 'Updated Filter',
      tier: FilterTier.SECONDARY,
    };

    it('should update a filter successfully', async () => {
      const updatedFilter = { ...mockFilter, ...updateFilterDto, priority: 3 };
      mockAdminService.updateFilter.mockResolvedValue(updatedFilter);

      const result = await controller.updateFilter('123', updateFilterDto);

      expect(mockAdminService.updateFilter).toHaveBeenCalledWith(
        '123',
        updateFilterDto,
      );
      expect(result).toEqual(updatedFilter);
    });

    it('should handle not found error', async () => {
      mockAdminService.updateFilter.mockRejectedValue(
        new NotFoundException('Filter not found'),
      );

      await expect(
        controller.updateFilter('invalid-id', updateFilterDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFilter', () => {
    it('should delete a filter successfully', async () => {
      mockAdminService.deleteFilter.mockResolvedValue(undefined);

      await controller.deleteFilter('123');

      expect(mockAdminService.deleteFilter).toHaveBeenCalledWith('123');
    });

    it('should handle not found error', async () => {
      mockAdminService.deleteFilter.mockRejectedValue(
        new NotFoundException('Filter not found'),
      );

      await expect(controller.deleteFilter('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
