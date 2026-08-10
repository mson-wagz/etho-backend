/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoryResponse: CategoryResponseDto[] = [
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      path: ['Electronics'],
    },
    {
      id: '2',
      name: 'Clothing',
      slug: 'clothing',
      path: ['Clothing'],
    },
    {
      id: '3',
      name: 'Home & Garden',
      slug: 'home-garden',
      path: ['Home & Garden'],
    },
  ];

  const mockCategoriesService = {
    getAllCategories: jest.fn(),
    getTopLevelCategories: jest.fn(),
    getCategoryBySlug: jest.fn(),
    getSubcategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return categories successfully', async () => {
      mockCategoriesService.getAllCategories.mockResolvedValue(
        mockCategoryResponse,
      );

      const result = await controller.getCategories();

      expect(service.getAllCategories).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        data: mockCategoryResponse,
      });
    });

    it('should return empty array when no categories found', async () => {
      mockCategoriesService.getAllCategories.mockResolvedValue([]);

      const result = await controller.getCategories();

      expect(service.getAllCategories).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it('should throw HttpException when service throws an error', async () => {
      const errorMessage = 'Database connection failed';
      mockCategoriesService.getAllCategories.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getCategories()).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Failed to fetch categories',
            error: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(service.getAllCategories).toHaveBeenCalledTimes(1);
    });

    it('should handle service throwing error without message', async () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';
      mockCategoriesService.getAllCategories.mockRejectedValue(
        errorWithoutMessage,
      );

      await expect(controller.getCategories()).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Failed to fetch categories',
            error: 'Unknown error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(service.getAllCategories).toHaveBeenCalledTimes(1);
    });

    it('should handle service throwing non-Error object', async () => {
      const nonErrorObject = 'String error';
      mockCategoriesService.getAllCategories.mockRejectedValue(nonErrorObject);

      await expect(controller.getCategories()).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Failed to fetch categories',
            error: 'Unknown error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(service.getAllCategories).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined error', async () => {
      mockCategoriesService.getAllCategories.mockRejectedValue(null);

      await expect(controller.getCategories()).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Failed to fetch categories',
            error: 'Unknown error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(service.getAllCategories).toHaveBeenCalledTimes(1);
    });
  });
});
