import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FilterService } from './filters.service';
import { FiltersResponse } from './dto/filters-response.dto';

describe('FiltersController', () => {
  let controller: FiltersController;

  const mockFiltersResponse: FiltersResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Eco-Friendly',
    slug: 'eco-friendly',
    tier: 'premium',
    description: 'Environmentally sustainable product',
    keywords: ['eco', 'sustainable', 'green'],
    priority: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockFiltersResponseArray: FiltersResponse[] = [
    mockFiltersResponse,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Organic',
      slug: 'organic',
      tier: 'standard',
      description: 'Made with certified organic materials',
      keywords: ['organic', 'certified', 'natural'],
      priority: 2,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ];

  const mockFilterService = {
    getFilters: jest.fn(),
    getFilterBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiltersController],
      providers: [
        {
          provide: FilterService,
          useValue: mockFilterService,
        },
      ],
    }).compile();

    controller = module.get<FiltersController>(FiltersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFilters', () => {
    it('should return all filters', async () => {
      mockFilterService.getFilters.mockResolvedValue(mockFiltersResponseArray);

      const result = await controller.getFilters();

      expect(mockFilterService.getFilters).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFiltersResponseArray);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no filters exist', async () => {
      mockFilterService.getFilters.mockResolvedValue([]);

      const result = await controller.getFilters();

      expect(mockFilterService.getFilters).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Service error';
      mockFilterService.getFilters.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getFilters()).rejects.toThrow(errorMessage);
      expect(mockFilterService.getFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFilterBySlug', () => {
    it('should return filter when found', async () => {
      mockFilterService.getFilterBySlug.mockResolvedValue(mockFiltersResponse);

      const result = await controller.getFilterBySlug('eco-friendly');

      expect(mockFilterService.getFilterBySlug).toHaveBeenCalledWith(
        'eco-friendly',
      );
      expect(result).toEqual(mockFiltersResponse);
    });

    it('should throw NotFoundException when filter not found', async () => {
      mockFilterService.getFilterBySlug.mockResolvedValue(null);

      await expect(controller.getFilterBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getFilterBySlug('non-existent')).rejects.toThrow(
        'Filter not found',
      );

      expect(mockFilterService.getFilterBySlug).toHaveBeenCalledWith(
        'non-existent',
      );
    });

    it('should handle special characters in slug', async () => {
      const specialSlug = 'eco-friendly-100%';
      mockFilterService.getFilterBySlug.mockResolvedValue(mockFiltersResponse);

      const result = await controller.getFilterBySlug(specialSlug);

      expect(mockFilterService.getFilterBySlug).toHaveBeenCalledWith(
        specialSlug,
      );
      expect(result).toEqual(mockFiltersResponse);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Service error';
      mockFilterService.getFilterBySlug.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getFilterBySlug('eco-friendly')).rejects.toThrow(
        errorMessage,
      );
      expect(mockFilterService.getFilterBySlug).toHaveBeenCalledWith(
        'eco-friendly',
      );
    });
  });
});
