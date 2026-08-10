import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { VariantOptionSelection } from './variant-option-selection.entity';
import { ProductAvailability } from '../common/enums/product.enum';

@Entity('product_variants')
@Index('idx_product_variants_product', ['product_id'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  source_url: string;

  @Column({ type: 'uuid', nullable: false })
  product_id: string;

  @Column({ type: 'text', array: true, nullable: false })
  images: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compare_at_price: number;

  @Column({
    type: 'enum',
    enum: ProductAvailability,
    default: ProductAvailability.IN_STOCK,
  })
  availability: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(
    () => VariantOptionSelection,
    (selection) => selection.product_variant,
  )
  option_selections: VariantOptionSelection[];
}
