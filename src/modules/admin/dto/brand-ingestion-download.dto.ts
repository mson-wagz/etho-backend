import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DownloadFormat {
  JSON = 'json',
  CSV = 'csv',
}

export class BrandIngestionDownloadQueryDto {
  @ApiProperty({
    enum: DownloadFormat,
    description: 'Download format',
    example: DownloadFormat.JSON,
  })
  @IsEnum(DownloadFormat)
  format: DownloadFormat;
}
