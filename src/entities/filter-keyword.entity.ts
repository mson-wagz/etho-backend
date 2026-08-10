import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Filter } from './filter.entity';

@Entity('filter_keywords')
@Index('idx_filter_keywords_filter_id', ['filter_id'])
@Index('idx_filter_keywords_keyword', ['keyword'])
export class FilterKeyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  filter_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  keyword: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Filter, (filter) => filter.keywords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'filter_id' })
  filter: Filter;
}
