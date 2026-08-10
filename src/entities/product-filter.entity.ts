import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Filter } from './filter.entity';

@Entity('product_filters')
@Index('idx_product_filters_product', ['product_id'])
@Index('idx_product_filters_filter', ['filter_id'])
export class ProductFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  product_id: string;

  @Column({ type: 'uuid', nullable: false })
  filter_id: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: false })
  confidence_score: number;

  @Column({ type: 'int', nullable: true })
  percentage: number;

  @Column({ type: 'text', array: true, nullable: true })
  evidence_text: string[];

  @Column({ type: 'varchar', nullable: false })
  source: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assigned_at: Date;

  @Column({ type: 'varchar', length: 50, default: 'llm' })
  assigned_by: string;

  @ManyToOne(() => Product, (product) => product.product_filters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Filter, (filter) => filter.product_filters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}
