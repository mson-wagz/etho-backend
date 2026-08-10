import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { OptionChoice } from './option-choice.entity';

@Entity('variant_option_selections')
@Index('idx_variant_option_selections_variant', ['product_variant_id'])
@Index('idx_variant_option_selections_choice', ['option_choice_id'])
@Index('unique_variant_choice', ['product_variant_id', 'option_choice_id'], {
  unique: true,
})
export class VariantOptionSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  product_variant_id: string;

  @Column({ type: 'uuid', nullable: false })
  option_choice_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => ProductVariant, (variant) => variant.option_selections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariant;

  @ManyToOne(() => OptionChoice, (choice) => choice.variant_selections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_choice_id' })
  option_choice: OptionChoice;
}
