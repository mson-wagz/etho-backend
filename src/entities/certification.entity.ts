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
import { Filter } from './filter.entity';
import { ProductCertification } from './product-certification.entity';

@Entity('certifications')
@Index('idx_certifications_filter', ['filter_id'])
@Index('idx_certifications_slug', ['slug'])
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  filter_id: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  slug: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  certifying_body: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Filter, (filter) => filter.certifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;

  @OneToMany(
    () => ProductCertification,
    (productCertification) => productCertification.certification,
  )
  product_certifications: ProductCertification[];
}
