import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductFilter } from '../entities/product-filter.entity';

@Injectable()
export class ProductFilterRepository extends Repository<ProductFilter> {
  constructor(private dataSource: DataSource) {
    super(ProductFilter, dataSource.createEntityManager());
  }

  async findByProductId(productId: string): Promise<ProductFilter[]> {
    return this.find({ where: { product_id: productId } });
  }

  async findByFilterId(filterId: string): Promise<ProductFilter[]> {
    return this.find({ where: { filter_id: filterId } });
  }
}
