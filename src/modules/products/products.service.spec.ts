/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductRepository } from '../../repository/product.repository';
import { CategoryRepository } from '../../repository/category.repository';
import { SearchQueryRepository } from '../../repository/search-query.repository';
import { AnalyticsEventRepository } from '../../repository/analytics-event.repository';
import { DataSource } from 'typeorm';
import { FilterProductDto } from './dto/filter-product.dto';

export function createMockProduct(overrides: Partial<any> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    short_description: 'Short description',
    price: 99.99,
    compare_at_price: 120.0,
    currency: 'USD',
    category: { toString: () => 'electronics' },
    materials: ['cotton', 'polyester'],
    certifications: ['organic'],
    badges: ['eco-friendly'],
    images: ['image1.jpg'],
    slug: 'test-product',
    brand_id: 'brand-123',
    seller_url: 'https://example.com/seller',
    seller_name: 'Test Seller',
    seller_location: 'New York, USA',
    extra_details: {},
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    category_id: 'cat-123',
    condition: 'new',
    has_variants: false,
    dimensions: { length: 10, width: 5, height: 2 },
    weight: 1.5,
    stock: 100,
    sku: 'SKU123',
    barcode: '123456789012',
    tags: ['tag1', 'tag2'],
    vendor: 'Test Vendor',
    is_active: true,
    is_featured: false,
    is_discounted: false,
    discount_percentage: 0,
    rating: 4.5,
    reviews_count: 10,
    shipping_details: { method: 'standard', cost: 5.0 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    extraction_method: 'api',
    extraction_confidence: 95,
    status: 'active',
    stock_status: 'in_stock',
    availability: 'available',
    source_url: 'https://example.com/product',
    external_id: 'ext-123',
    last_updated: new Date('2024-01-01'),
    metadata: {},
    version: 1,
    published_at: new Date('2024-01-01'),
    archived_at: null,
    deleted_at: null,
    product_type: 'physical',
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    warranty_info: '1 year',
    product_filters: [],
    ...overrides,
  } as any;
}

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductRepository: Partial<ProductRepository>;
  let mockSearchQueryRepository: Partial<SearchQueryRepository>;
  let mockCategoryRepository: Partial<CategoryRepository>;

  const mockProduct = createMockProduct();

  beforeEach(async () => {
    mockProductRepository = {
      findWithFilters: jest.fn(),
      findBySlug: jest.fn(),
    };

    mockSearchQueryRepository = {
      logSearch: jest.fn().mockResolvedValue(undefined),
    };

    mockCategoryRepository = {
      findDescendantIdsBySlug: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductRepository,
          useValue: mockProductRepository,
        },
        {
          provide: SearchQueryRepository,
          useValue: mockSearchQueryRepository,
        },
        {
          provide: AnalyticsEventRepository,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: CategoryRepository,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return products with default pagination', async () => {
      const filter: FilterProductDto = {};
      const mockResult = {
        products: [mockProduct],
        total: 1,
      };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      const result = await service.getProducts(filter);

      expect(result).toEqual({
        products: [
          {
            id: mockProduct.id,
            name: mockProduct.name,
            description: mockProduct.description,
            category: undefined,
            materials: mockProduct.materials,
            variants: [],
            slug: mockProduct.slug,
            sourceUrl: mockProduct.source_url,
            badges: [],
            brand: null,
            createdAt: mockProduct.created_at,
            updatedAt: mockProduct.updated_at,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith({
        categoryIds: undefined,
        materials: undefined,
        certifications: undefined,
        badges: undefined,
        sortBy: 'newest',
        searchQuery: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should handle search query parameter', async () => {
      const filter: FilterProductDto = { q: 'cotton shirt' };
      const mockResult = {
        products: [mockProduct],
        total: 1,
      };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      const result = await service.getProducts(filter, '127.0.0.1');

      expect(result).toEqual({
        products: [
          {
            id: mockProduct.id,
            name: mockProduct.name,
            description: mockProduct.description,
            category: undefined,
            materials: mockProduct.materials,
            variants: [],
            slug: mockProduct.slug,
            sourceUrl: mockProduct.source_url,
            badges: [],
            brand: null,
            createdAt: mockProduct.created_at,
            updatedAt: mockProduct.updated_at,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith({
        categoryIds: undefined,
        materials: undefined,
        certifications: undefined,
        badges: undefined,
        sortBy: 'newest',
        searchQuery: 'cotton shirt',
        limit: 20,
        offset: 0,
      });

      expect(mockSearchQueryRepository.logSearch).toHaveBeenCalledWith(
        'cotton shirt',
        1,
        '127.0.0.1',
      );
    });

    it('should throw BadRequestException for empty search query', async () => {
      const filter: FilterProductDto = { q: '' };

      await expect(service.getProducts(filter, '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProducts(filter, '127.0.0.1')).rejects.toThrow(
        'Search query cannot be empty when provided',
      );
    });

    it('should throw BadRequestException for whitespace-only search query', async () => {
      const filter: FilterProductDto = { q: '   ' };

      await expect(service.getProducts(filter, '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProducts(filter, '127.0.0.1')).rejects.toThrow(
        'Search query cannot be empty when provided',
      );
    });

    it('should handle search query with other filters', async () => {
      const filter: FilterProductDto = {
        q: 'organic',
        category: 'clothing',
        materials: ['cotton'],
        price_min: 20,
        price_max: 50,
      };
      const mockResult = {
        products: [mockProduct],
        total: 1,
      };

      jest
        .spyOn(mockCategoryRepository, 'findDescendantIdsBySlug')
        .mockResolvedValue(['cat-id-1', 'cat-id-2']);

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      const result = await service.getProducts(filter, '192.168.1.1');

      expect(result.products).toHaveLength(1);
      expect(mockCategoryRepository.findDescendantIdsBySlug).toHaveBeenCalledWith(
        'clothing',
      );
      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryIds: ['cat-id-1', 'cat-id-2'],
          materials: ['cotton'],
          searchQuery: 'organic',
        }),
      );

      expect(mockSearchQueryRepository.logSearch).toHaveBeenCalledWith(
        'organic',
        1,
        '192.168.1.1',
      );
    });

    it('should continue search even if logging fails', async () => {
      const filter: FilterProductDto = { q: 'test product' };
      const mockResult = {
        products: [mockProduct],
        total: 1,
      };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      jest
        .spyOn(mockSearchQueryRepository, 'logSearch')
        .mockRejectedValue(new Error('Database logging error'));

      const result = await service.getProducts(filter, '127.0.0.1');

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should trim search query before processing', async () => {
      const filter: FilterProductDto = { q: '  sustainable products  ' };
      const mockResult = {
        products: [mockProduct],
        total: 1,
      };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      await service.getProducts(filter, '10.0.0.1');

      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: 'sustainable products',
        }),
      );

      expect(mockSearchQueryRepository.logSearch).toHaveBeenCalledWith(
        'sustainable products',
        1,
        '10.0.0.1',
      );
    });

    it('should handle custom pagination', async () => {
      const filter: FilterProductDto = { page: 2, limit: 10 };
      const mockResult = { products: [], total: 25 };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      const result = await service.getProducts(filter);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
          searchQuery: undefined,
        }),
      );
    });

    it('should enforce maximum limit of 100', async () => {
      const filter: FilterProductDto = { limit: 150 };
      const mockResult = { products: [], total: 0 };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      await service.getProducts(filter);

      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        }),
      );
    });

    it('should handle filters correctly', async () => {
      const filter: FilterProductDto = {
        category: 'electronics',
        materials: ['cotton', 'silk'],
        certifications: ['organic'],
        badges: ['eco-friendly'],
      };
      const mockResult = { products: [], total: 0 };

      jest
        .spyOn(mockCategoryRepository, 'findDescendantIdsBySlug')
        .mockResolvedValue(['cat-id-electronics', 'cat-id-sub']);

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      await service.getProducts(filter);

      expect(mockCategoryRepository.findDescendantIdsBySlug).toHaveBeenCalledWith(
        'electronics',
      );
      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith({
        categoryIds: ['cat-id-electronics', 'cat-id-sub'],
        materials: ['cotton', 'silk'],
        certifications: ['organic'],
        badges: ['eco-friendly'],
        sortBy: 'newest',
        searchQuery: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should include descendant category IDs when filtering by category', async () => {
      const filter: FilterProductDto = { category: 'apparel' };
      const mockResult = { products: [], total: 0 };
      const descendantIds = ['id-apparel', 'id-womens', 'id-mens', 'id-kids'];

      jest
        .spyOn(mockCategoryRepository, 'findDescendantIdsBySlug')
        .mockResolvedValue(descendantIds);

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      await service.getProducts(filter);

      expect(mockCategoryRepository.findDescendantIdsBySlug).toHaveBeenCalledWith(
        'apparel',
      );
      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ categoryIds: descendantIds }),
      );
    });

    it('should pass undefined categoryIds when no category filter is given', async () => {
      const filter: FilterProductDto = {};
      const mockResult = { products: [], total: 0 };

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockResolvedValue(mockResult);

      await service.getProducts(filter);

      expect(mockCategoryRepository.findDescendantIdsBySlug).not.toHaveBeenCalled();
      expect(mockProductRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ categoryIds: undefined }),
      );
    });

    it('should handle repository errors', async () => {
      const filter: FilterProductDto = {};
      const repositoryError = new Error('Database connection failed');

      jest
        .spyOn(mockProductRepository, 'findWithFilters')
        .mockRejectedValue(repositoryError);

      await expect(service.getProducts(filter)).rejects.toThrow(
        'Failed to fetch products: Database connection failed',
      );
    });
  });

  describe('edge cases and validation', () => {
    it('should handle undefined search query', async () => {});
  });

  describe('data transformation', () => {
    it('should handle product with null category', async () => {});
  });

  describe('getProductBySlug', () => {
    it('should return product when found', async () => {
      const slug = 'test-product';
      jest
        .spyOn(mockProductRepository, 'findBySlug')
        .mockResolvedValue(mockProduct);

      const result = await service.getProductBySlug(slug);

      expect(result).toEqual({
        id: mockProduct.id,
        name: mockProduct.name,
        description: mockProduct.description,
        category: '',
        variants: [],
        slug: mockProduct.slug,
        sourceUrl: mockProduct.source_url,
        badges: [],
        brand: null,
        createdAt: mockProduct.created_at,
        updatedAt: mockProduct.updated_at,
      });

      expect(mockProductRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should return null when product not found', async () => {
      const slug = 'nonexistent-product';
      jest.spyOn(mockProductRepository, 'findBySlug').mockResolvedValue(null);

      const result = await service.getProductBySlug(slug);

      expect(result).toBeNull();
      expect(mockProductRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should handle repository errors', async () => {
      const slug = 'test-product';
      const repositoryError = new Error('Database error');

      jest
        .spyOn(mockProductRepository, 'findBySlug')
        .mockRejectedValue(repositoryError);

      await expect(service.getProductBySlug(slug)).rejects.toThrow(
        'Failed to fetch product: Database error',
      );
    });
  });
});
