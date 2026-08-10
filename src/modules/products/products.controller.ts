/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Req,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { ProductDetailService } from './product-detail.service';
import { FilterProductDto } from './dto/filter-product.dto';
import {
  ProductListResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productDetailService: ProductDetailService,
  ) {}

  @Get('best-sellers')
  @ApiOperation({
    summary: 'Get best-selling products (top 6 most added to cart)',
  })
  @ApiResponse({
    status: 200,
    description: 'Best sellers returned successfully',
    type: [ProductDetailResponseDto],
  })
  async getBestSellers(): Promise<ProductDetailResponseDto[]> {
    return (await this.productsService.getBestSellers()) as any;
  }

  @Get()
  @ApiOperation({ summary: 'Get products with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of products returned successfully',
    type: ProductListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid filter parameters' })
  async getProducts(
    @Query() filter: FilterProductDto,
    @Req() request: Request,
  ): Promise<ProductListResponseDto> {
    try {
      const sessionId = request.sessionId;
      return await this.productsService.getProducts(filter, sessionId);
    } catch (error: any) {
      console.error('Controller caught error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Invalid filter parameters: ${error.message}`,
      );
    }
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products for a given product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of related products to return (default: 5)',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Related products returned successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getRelatedProducts(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<ProductResponseDto[]> {
    return (await this.productDetailService.getRelatedProducts(
      id,
      Math.min(limit, 20),
    )) as any;
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get detailed product information' })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'organic-cotton-tshirt',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details returned successfully',
    type: ProductDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductDetails(
    @Param('slug') slug: string,
  ): Promise<ProductDetailResponseDto> {
    return await this.productDetailService.getProductDetails(slug);
  }
}
