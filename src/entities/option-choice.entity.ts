import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { ProductOptionType } from './product-option-type.entity';
import { VariantOptionSelection } from './variant-option-selection.entity';

@Entity('option_choices')
@Index('idx_option_choices_option_type', ['option_type_id'])
export class OptionChoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  option_type_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  choice: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => ProductOptionType, (optionType) => optionType.choices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_type_id' })
  option_type: ProductOptionType;

  @OneToMany(
    () => VariantOptionSelection,
    (selection) => selection.option_choice,
  )
  variant_selections: VariantOptionSelection[];
}
