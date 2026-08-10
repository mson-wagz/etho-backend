import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  OneToOne,
} from 'typeorm';
import { Product } from './product.entity';
import { IngestionRun } from './ingestion-run.entity';
import { ScrapingSource } from './scraping-source.entity';

@Entity('brands')
@Index('unique_brand_name', ['name'], { unique: true })
@Index('idx_brands_scrape_status', ['scrape_status'])
@Index('idx_brands_last_scraped', ['last_scraped_at'])
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  website_url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  last_scraped_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  scrape_status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];

  @OneToOne(() => ScrapingSource, (source) => source.brand)
  scraping_source: ScrapingSource;

  @OneToMany(() => IngestionRun, (ingestionRun) => ingestionRun.brand)
  ingestion_runs: IngestionRun[];
}
