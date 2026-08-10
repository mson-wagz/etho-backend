import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PeriodUnit {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
}

@Entity('general_settings')
export class GeneralSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  scraping_frequency: number;

  @Column({ type: 'int', nullable: false, default: 3 })
  scraping_frequency_period_value: number;

  @Column({
    type: 'enum',
    enum: PeriodUnit,
    nullable: false,
    default: PeriodUnit.DAYS,
  })
  scraping_frequency_period_unit: PeriodUnit;

  @Column({
    type: 'int',
    nullable: true,
    default: 10,
  })
  discovery_max_queries: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
