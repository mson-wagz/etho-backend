/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesListResponseDto } from './dto/category-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'List of categories returned successfully',
    type: CategoriesListResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Failed to fetch categories' })
  async getCategories(
    @Query('select') select: 'all' | 'available' = 'all',
  ): Promise<CategoriesListResponseDto> {
    try {
      const categories = await this.categoriesService.getAllCategories(select);
      return {
        success: true,
        data: categories,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch categories',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('top-level')
  @ApiOperation({ summary: 'Get top-level categories' })
  @ApiResponse({
    status: 200,
    description: 'List of categories returned successfully',
    type: CategoriesListResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Failed to fetch categories' })
  async getTopLevelCategories(
    @Query('select') select: 'all' | 'available' = 'all',
  ): Promise<CategoriesListResponseDto> {
    try {
      const categories =
        await this.categoriesService.getTopLevelCategories(select);
      return {
        success: true,
        data: categories,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch categories',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('children/:parentId')
  @ApiOperation({ summary: 'Get subcategories by parent category ID' })
  @ApiResponse({
    status: 200,
    description: 'List of subcategories returned successfully',
    type: CategoriesListResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Failed to fetch subcategories' })
  async getSubcategories(
    @Param('parentId') parentId: string,
  ): Promise<CategoriesListResponseDto> {
    try {
      const subcategories =
        await this.categoriesService.getSubcategories(parentId);
      return {
        success: true,
        data: subcategories,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch subcategories',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
