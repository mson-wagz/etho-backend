import { ApiProperty } from '@nestjs/swagger';

export class AdminKeywordResponseDto {
  @ApiProperty({
    description: 'Keyword ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Keyword text',
    example: 'organic',
  })
  keyword: string;

  @ApiProperty({
    description: 'Filter/Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  filter_id: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-02T00:00:00Z',
  })
  updated_at: Date;
}
