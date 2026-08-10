import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Certification } from './certification.entity';

@Entity('product_certifications')
export class ProductCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  product_id: string;

  @Column({ type: 'uuid', nullable: false })
  certification_id: string;

  @Column({ type: 'varchar', nullable: false })
  detected_from: string;

  @CreateDateColumn({ type: 'timestamp' })
  assigned_at: Date;

  @ManyToOne(() => Product, (product) => product.product_certifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(
    () => Certification,
    (certification) => certification.product_certifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'certification_id' })
  certification: Certification;
}
