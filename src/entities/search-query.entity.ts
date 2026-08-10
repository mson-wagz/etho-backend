import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('search_queries')
@Index('idx_search_queries_query', ['query'])
@Index('idx_search_queries_searched_at', ['searched_at'])
@Index('idx_search_queries_session', ['session_id'])
export class SearchQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  session_id: string;

  @Column({ type: 'text', nullable: false })
  query: string;

  @Column({ type: 'int', default: 0 })
  results_count: number;

  @Column({ type: 'jsonb', nullable: true })
  filters_applied: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  searched_at: Date;
}
