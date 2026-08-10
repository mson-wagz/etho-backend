import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Brand } from './brand.entity';
import { IngestionRun } from './ingestion-run.entity';

@Entity('scraping_sources')
@Index('idx_scraping_sources_brand', ['brand_id'])
@Index('idx_scraping_sources_is_active', ['is_active'])
@Index('idx_scraping_sources_last_scrape', ['last_successful_scrape'])
export class ScrapingSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  brand_id: string;

  @Column({ type: 'jsonb', nullable: false })
  config: object;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_successful_scrape: Date;

  @Column({ type: 'text', nullable: true })
  last_error: string;

  @Column({ type: 'int', default: 0 })
  success_count: number;

  @Column({ type: 'int', default: 0 })
  failure_count: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToOne(() => Brand, (brand) => brand.scraping_source, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => IngestionRun, (ingestionRun) => ingestionRun.scraping_source)
  ingestion_runs: IngestionRun[];
}
