import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ApplyOperationType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

export enum ApplyModelType {
  FILTER = 'filter',
  KEYWORD = 'keyword',
  CERTIFICATION = 'certification',
}

export class FilterSettingsOperationDto {
  @ApiProperty({ enum: ApplyOperationType, description: 'Operation type' })
  @IsEnum(ApplyOperationType)
  type: ApplyOperationType;

  @ApiProperty({
    enum: ApplyModelType,
    description: 'Model type to operate on',
  })
  @IsEnum(ApplyModelType)
  model_type: ApplyModelType;

  @ApiPropertyOptional({
    description: 'Record ID — required for edit and delete operations',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description:
      'Client-side draft ID for newly created records. Used to resolve cross-operation references within the same batch (e.g. a keyword referencing a filter also being created in this batch).',
    example: 'draft-filter-create-1700000000000-abc123',
  })
  @IsString()
  @IsOptional()
  draft_id?: string;

  @ApiPropertyOptional({
    description: 'Filter or certification name',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter tier (primary | secondary)',
    example: 'primary',
  })
  @IsString()
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional({ description: 'Filter or certification description' })
  @IsString()
  @IsOptional()
  description?: string;

  // ---- Keyword field ----

  @ApiPropertyOptional({ description: 'Keyword text', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  keyword?: string;

  // ---- Shared relational ----

  @ApiPropertyOptional({
    description:
      'Parent filter ID for keywords and certifications. May be a draft_id when the parent filter is also being created in the same batch.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  filter_id?: string;

  // ---- Certification fields ----

  @ApiPropertyOptional({ description: 'Certifying body name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  certifying_body?: string;
}

export class ApplyFilterSettingsDto {
  @ApiProperty({
    type: [FilterSettingsOperationDto],
    description: 'Ordered list of operations to apply atomically',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterSettingsOperationDto)
  operations: FilterSettingsOperationDto[];
}

export class AppliedOperationResultDto {
  @ApiProperty({
    description: 'Zero-based index of this operation in the request array',
  })
  operation_index: number;

  @ApiProperty({ enum: ApplyOperationType })
  type: ApplyOperationType;

  @ApiProperty({ enum: ApplyModelType })
  model_type: ApplyModelType;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional({
    description: 'Real database ID of the created/updated record',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'Client draft_id echoed back for ID mapping on the client',
  })
  draft_id?: string;
}

export class ApplyFilterSettingsResponseDto {
  @ApiProperty({ description: 'Number of operations successfully applied' })
  applied_count: number;

  @ApiProperty({ description: 'Total number of operations submitted' })
  total_count: number;

  @ApiProperty({ type: [AppliedOperationResultDto] })
  results: AppliedOperationResultDto[];
}
