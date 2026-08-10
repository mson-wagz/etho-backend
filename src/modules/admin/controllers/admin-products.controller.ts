import {
  Controller,
  Get,
  Put,
  Delete,
  HttpException,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminService } from '../services/admin.service';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProductListResponseDto } from 'src/modules/products/dto/product-response.dto';
import { FilterProductDto } from 'src/modules/products/dto/filter-product.dto';
import { UpdateProductDto } from 'src/modules/products/dto/update-product.dto';

@Controller('admin/products')
@UseGuards(AdminGuard)
export class AdminProductsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getProductStats() {
    return this.adminService.getAdminProductStats();
  }

  @Get('')
  @ApiOperation({ summary: 'Get products with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of products returned successfully',
    type: ProductListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid filter parameters' })
  async getProducts(
    @Query() filter: FilterProductDto,
  ): Promise<ProductListResponseDto> {
    try {
      return await this.adminService.getProducts(filter);
    } catch (error) {
      throw new HttpException('Failed to fetch products', error.status || 500);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID for editing' })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product returned successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string): Promise<any> {
    try {
      return await this.adminService.getProductById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch product',
        error.status || 500,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: UpdateProductDto,
  ): Promise<any> {
    try {
      return await this.adminService.updateProduct(id, updateData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update product',
        error.status || 500,
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string): Promise<void> {
    try {
      await this.adminService.deleteProduct(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete product',
        error.status || 500,
      );
    }
  }
}
