import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FilterService } from './filters.service';
import { FilterRepository } from '../../repository/filter.repository';
import { FilterKeywordRepository } from '../../repository/filter-keyword.repository';
import { Filter, FilterTier } from '../../entities/filter.entity';
import { CreateFilterDto } from '../admin/dto/create-filter.dto';
import { UpdateFilterDto } from '../admin/dto/update-filter.dto';

describe('FilterService', () => {
  let service: FilterService;
  let filtersRepository: FilterRepository;
  let filterKeywordRepository: FilterKeywordRepository;

  const mockBadge: Filter = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Eco-Friendly',
    description: 'Environmentally sustainable product',
    slug: 'eco-friendly',
    tier: 'primary' as any,
    keywords: [],
    priority: 1,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    certifications: [],
    product_filters: [],
  };

  const mockBadges: Filter[] = [
    mockBadge,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Organic',
      description: 'Made with certified organic materials',
      slug: 'organic',
      tier: 'secondary' as any,
      keywords: [],
      priority: 2,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
      certifications: [],
      product_filters: [],
    },
  ];

  const mockFiltersRepository = {
    find: jest.fn(),
    findBySlug: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockFilterKeywordRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilterService,
        {
          provide: FilterRepository,
          useValue: mockFiltersRepository,
        },
        {
          provide: FilterKeywordRepository,
          useValue: mockFilterKeywordRepository,
        },
      ],
    }).compile();

    service = module.get<FilterService>(FilterService);
    filtersRepository = module.get<FilterRepository>(FilterRepository);
    filterKeywordRepository = module.get<FilterKeywordRepository>(
      FilterKeywordRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBadges', () => {
    it('should return all badges', async () => {
      mockFiltersRepository.find.mockResolvedValue(mockBadges);

      const result = await service.getFilters();

      expect(filtersRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockBadge.id,
        name: mockBadge.name,
        description: mockBadge.description,
        slug: mockBadge.slug,
        tier: mockBadge.tier,
        keywords: [],
        priority: mockBadge.priority,
        createdAt: mockBadge.created_at,
        updatedAt: mockBadge.updated_at,
      });
    });

    it('should return empty array when no badges found', async () => {
      mockFiltersRepository.find.mockResolvedValue([]);

      const result = await service.getFilters();

      expect(filtersRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(0);
    });

    it('should throw error when repository fails', async () => {
      const errorMessage = 'Database connection error';
      mockFiltersRepository.find.mockRejectedValue(new Error(errorMessage));

      await expect(service.getFilters()).rejects.toThrow(
        `Failed to fetch filters: ${errorMessage}`,
      );
    });
  });

  describe('getFilterBySlug', () => {
    it('should return filter when found', async () => {
      mockFiltersRepository.findBySlug.mockResolvedValue(mockBadge);

      const result = await service.getFilterBySlug('eco-friendly');

      expect(filtersRepository.findBySlug).toHaveBeenCalledWith('eco-friendly');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.slug).toBe('eco-friendly');
    });

    it('should return null when filter not found', async () => {
      mockFiltersRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getFilterBySlug('non-existent');

      expect(filtersRepository.findBySlug).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should throw error when repository fails', async () => {
      const errorMessage = 'Database connection error';
      mockFiltersRepository.findBySlug.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.getFilterBySlug('eco-friendly')).rejects.toThrow(
        `Failed to fetch filter: ${errorMessage}`,
      );
    });
  });

  describe('createFilter', () => {
    const createFilterDto: CreateFilterDto = {
      name: 'Test Filter',
      tier: FilterTier.PRIMARY,
      description: 'Test filter description',
    };

    it('should create filter with primary tier (priority 6)', async () => {
      mockFiltersRepository.findOne.mockResolvedValue(null);
      mockFiltersRepository.create.mockReturnValue(mockBadge);
      mockFiltersRepository.save.mockResolvedValue(mockBadge);

      const result = await service.createFilter(createFilterDto);

      expect(mockFiltersRepository.create).toHaveBeenCalledWith({
        name: 'Test Filter',
        slug: 'test-filter',
        tier: FilterTier.PRIMARY,
        description: 'Test filter description',
        priority: 6,
      });
      expect(result).toEqual(mockBadge);
    });

    it('should create filter with secondary tier (priority 3)', async () => {
      const secondaryDto = { ...createFilterDto, tier: FilterTier.SECONDARY };
      mockFiltersRepository.findOne.mockResolvedValue(null);
      mockFiltersRepository.create.mockReturnValue(mockBadge);
      mockFiltersRepository.save.mockResolvedValue(mockBadge);

      await service.createFilter(secondaryDto);

      expect(mockFiltersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 3 }),
      );
    });

    it('should throw conflict when filter name exists', async () => {
      mockFiltersRepository.findOne.mockResolvedValue(mockBadge);

      await expect(service.createFilter(createFilterDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateFilter', () => {
    const updateFilterDto: UpdateFilterDto = {
      name: 'Updated Filter',
      tier: FilterTier.SECONDARY,
    };

    it('should update filter successfully', async () => {
      mockFiltersRepository.findOne
        .mockResolvedValueOnce(mockBadge)
        .mockResolvedValueOnce(null); // No existing filter with new name
      mockFiltersRepository.save.mockResolvedValue({
        ...mockBadge,
        ...updateFilterDto,
      });

      const result = await service.updateFilter('123', updateFilterDto);

      expect(mockFiltersRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result).toBeDefined();
    });

    it('should throw not found when filter does not exist', async () => {
      mockFiltersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateFilter('invalid-id', updateFilterDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update priority when tier changes', async () => {
      const filter = { ...mockBadge, tier: FilterTier.PRIMARY, priority: 6 };
      mockFiltersRepository.findOne.mockResolvedValue(filter);
      mockFiltersRepository.save.mockResolvedValue(filter);

      await service.updateFilter('123', { tier: FilterTier.SECONDARY });

      expect(mockFiltersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 3 }),
      );
    });
  });

  describe('deleteFilter', () => {
    it('should delete filter successfully', async () => {
      mockFiltersRepository.findOne.mockResolvedValue(mockBadge);
      mockFiltersRepository.remove.mockResolvedValue(mockBadge);

      await service.deleteFilter('123');

      expect(mockFiltersRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(mockFiltersRepository.remove).toHaveBeenCalledWith(mockBadge);
    });

    it('should throw not found when filter does not exist', async () => {
      mockFiltersRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFilter('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
