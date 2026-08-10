import { ApiProperty } from '@nestjs/swagger';

export class RerunIngestionResponseDto {
  @ApiProperty({
    description: 'ID of the created ingestion run for tracking',
    example: 'uuid-string',
  })
  ingestion_run_id: string;

  @ApiProperty({
    description: 'Status of the ingestion run',
    example: 'standby',
  })
  status: string;

  @ApiProperty({
    description: 'Ingestion mode that was requested',
    example: 'full',
  })
  mode: string;
}
