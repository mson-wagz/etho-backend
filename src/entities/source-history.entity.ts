import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('source_history')
export class SourceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  website_url: string;

  @Column({ type: 'varchar', default: 'manual' })
  origin: 'discovered' | 'manual';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  added_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
