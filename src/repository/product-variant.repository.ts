import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class ProductVariantRepository extends Repository<ProductVariant> {
  constructor(private dataSource: DataSource) {
    super(ProductVariant, dataSource.createEntityManager());
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return this.find({ where: { product_id: productId } });
  }
}
