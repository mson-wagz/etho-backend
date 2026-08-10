import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductDetailService } from './product-detail.service';
import { CategoryRepository } from '../../repository/category.repository';

@Module({
  imports: [],
  controllers: [ProductsController],
  providers: [ProductsService, ProductDetailService, CategoryRepository],
  exports: [ProductsService, ProductDetailService],
})
export class ProductsModule {}
