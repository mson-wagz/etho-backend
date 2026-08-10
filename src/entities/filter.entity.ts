import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Certification } from './certification.entity';
import { ProductFilter } from './product-filter.entity';
import { FilterKeyword } from './filter-keyword.entity';

export enum FilterTier {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

@Entity('filters')
@Index('unique_tier_slug', ['tier', 'slug'], { unique: true })
@Index('idx_filters_tier', ['tier'])
@Index('idx_filters_priority', ['priority'])
export class Filter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  slug: string;

  @Column({
    type: 'enum',
    enum: FilterTier,
    nullable: false,
  })
  tier: FilterTier;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => FilterKeyword, (keyword) => keyword.filter)
  keywords: FilterKeyword[];

  @OneToMany(() => Certification, (certification) => certification.filter)
  certifications: Certification[];

  @OneToMany(() => ProductFilter, (productFilter) => productFilter.filter)
  product_filters: ProductFilter[];
}
