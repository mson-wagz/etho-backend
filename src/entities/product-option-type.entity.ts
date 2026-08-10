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
import { OptionChoice } from './option-choice.entity';

@Entity('product_variant_types')
@Index('idx_product_option_types_product', ['product_id'])
export class ProductOptionType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  product_id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string; // e.g., "Color", "Size"

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Product, (product) => product.option_types, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => OptionChoice, (choice) => choice.option_type)
  choices: OptionChoice[];
}
