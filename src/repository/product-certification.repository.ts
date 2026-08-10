import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductCertification } from '../entities/product-certification.entity';

@Injectable()
export class ProductCertificationRepository extends Repository<ProductCertification> {
  constructor(private dataSource: DataSource) {
    super(ProductCertification, dataSource.createEntityManager());
  }

  async findByProductId(productId: string): Promise<ProductCertification[]> {
    return this.find({ where: { product_id: productId } });
  }

  async findByCertificationId(
    certificationId: string,
  ): Promise<ProductCertification[]> {
    return this.find({
      where: { certification_id: certificationId },
    });
  }
}
