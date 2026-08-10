import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { ScrapingSource } from './scraping-source.entity';
import {
  IngestionRunType,
  IngestionStatus,
} from '../common/enums/ingestion.enum';

@Entity('ingestion_runs')
@Index('idx_ingestion_runs_brand', ['brand_id'])
@Index('idx_ingestion_runs_source', ['scraping_source_id'])
@Index('idx_ingestion_runs_started_at', ['started_at'])
@Index('idx_ingestion_runs_status', ['status'])
@Index('idx_ingestion_runs_run_type', ['run_type'])
export class IngestionRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  brand_id: string;

  @ManyToOne(() => Brand, (brand) => brand.ingestion_runs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ type: 'uuid', nullable: true })
  scraping_source_id: string;

  @ManyToOne(() => ScrapingSource, (source) => source.ingestion_runs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'scraping_source_id' })
  scraping_source: ScrapingSource;

  @Column({
    type: 'enum',
    enum: IngestionRunType,
    nullable: false,
    default: IngestionRunType.SCHEDULED,
  })
  run_type: string;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.STANDBY,
  })
  status: string;

  @Column({ type: 'int', default: 0 })
  products_fetched: number;

  @Column({ type: 'int', default: 0 })
  products_added: number;

  @Column({ type: 'int', default: 0 })
  products_updated: number;

  @Column({ type: 'int', default: 0 })
  products_excluded: number;

  @Column({ type: 'int', default: 0 })
  errors_count: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: Array<{ message: string; stack?: string; timestamp: string }> | null;

  @CreateDateColumn({ type: 'timestamp' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number;
}
