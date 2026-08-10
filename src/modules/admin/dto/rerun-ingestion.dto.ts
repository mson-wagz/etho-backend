import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum IngestionMode {
  FULL = 'full',
  INCREMENTAL = 'incremental',
}

export class RerunIngestionDto {
  @ApiProperty({
    enum: IngestionMode,
    example: IngestionMode.FULL,
    description: 'Ingestion mode: full or incremental',
  })
  @IsEnum(IngestionMode)
  @IsNotEmpty()
  mode: IngestionMode;
}
