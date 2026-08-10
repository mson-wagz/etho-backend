import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductOptionType } from './product-option-type.entity';
import { ProductFilter } from './product-filter.entity';
import { ProductCertification } from './product-certification.entity';
import { AnalyticsEvent } from './analytics-event.entity';

@Entity('products')
@Index('idx_products_brand', ['brand_id'])
@Index('idx_products_category', ['category_id'])
@Index('idx_products_search_vector', ['search_vector'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  brand_id: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  short_description: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: false })
  category_id: string;

  @Column({ type: 'text', array: true, nullable: true })
  materials: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  extraction_method: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  extraction_confidence: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  filter_confidence: number;

  @Column({ type: 'timestamp', nullable: true })
  scraped_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  filtered_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @Column({ type: 'tsvector', nullable: true })
  search_vector: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  product_content_hash: string;

  @ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductOptionType, (optionType) => optionType.product)
  option_types: ProductOptionType[];

  @OneToMany(() => ProductFilter, (productFilter) => productFilter.product)
  product_filters: ProductFilter[];

  @OneToMany(
    () => ProductCertification,
    (certification) => certification.product,
  )
  product_certifications: ProductCertification[];

  @OneToMany(() => AnalyticsEvent, (event) => event.product)
  analytics_events: AnalyticsEvent[];

  @Column({ type: 'text', nullable: false })
  source_url: string;
}
