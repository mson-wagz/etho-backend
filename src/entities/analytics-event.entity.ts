import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { AnalyticsEventType } from '../types/enums/analytics.enum';

@Entity('analytics_events')
@Index('idx_analytics_events_type', ['event_type'])
@Index('idx_analytics_events_product', ['product_id'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  session_id: string;

  @Column({ type: 'enum', enum: AnalyticsEventType, nullable: false })
  event_type: AnalyticsEventType;

  @Column({ type: 'uuid', nullable: true })
  product_id: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Product, (product) => product.analytics_events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
