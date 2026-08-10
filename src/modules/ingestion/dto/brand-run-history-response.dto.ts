import { ApiProperty } from '@nestjs/swagger';

export class RunHistoryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  run_type: string;

  @ApiProperty()
  products_fetched: number;

  @ApiProperty()
  products_added: number;

  @ApiProperty()
  products_updated: number;

  @ApiProperty()
  products_excluded: number;

  @ApiProperty()
  errors_count: number;

  @ApiProperty()
  started_at: Date;

  @ApiProperty({ required: false })
  completed_at: Date;

  @ApiProperty({ required: false })
  duration_seconds: number;
}

export class BrandRunHistoryResponseDto {
  @ApiProperty({ type: [RunHistoryItemDto] })
  runs: RunHistoryItemDto[];

  @ApiProperty()
  total_runs: number;

  @ApiProperty()
  successful_runs: number;

  @ApiProperty()
  failed_runs: number;

  @ApiProperty()
  avg_duration_seconds: number;

  @ApiProperty()
  last_successful_run: Date | null;
}
