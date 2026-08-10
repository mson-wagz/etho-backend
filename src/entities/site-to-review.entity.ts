import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';

export enum SiteReviewStatus {
  PENDING = 'pending',
  AWAITING_REVIEW = 'awaiting_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('sites_to_review')
@Index('idx_sites_to_review_domain', ['domain'], { unique: true })
@Index('idx_sites_to_review_status', ['status'])
@Index('idx_sites_to_review_confidence', ['marketplace_confidence'])
export class SiteToReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  url: string;

  @Column({ type: 'text', nullable: false, unique: true })
  domain: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  snippet: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  marketplace_confidence: number;

  @Column({ type: 'jsonb', default: [] })
  ethical_indicators: string[];

  @Column({ type: 'boolean', nullable: true })
  robots_txt_allows_scraping: boolean;

  @Column({ type: 'text', nullable: true })
  robots_txt_details: string;

  @Column({ type: 'boolean', nullable: true })
  tos_allows_scraping: boolean;

  @Column({ type: 'text', nullable: true })
  tos_details: string;

  @Column({ type: 'text', nullable: true })
  tos_url: string;

  @Column({ type: 'boolean', nullable: true })
  is_scrapable: boolean;

  @Column({ type: 'text', nullable: true })
  discovery_reasoning: string;

  @Column({
    type: 'enum',
    enum: SiteReviewStatus,
    default: SiteReviewStatus.PENDING,
  })
  status: SiteReviewStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  discovered_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date;

  @Column({ type: 'text', nullable: true })
  review_notes: string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
