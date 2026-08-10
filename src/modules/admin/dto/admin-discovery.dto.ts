import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SiteReviewStatus } from '../../../entities/site-to-review.entity';

export class DiscoveryStatsResponseDto {
  @ApiProperty({ description: 'Total sites discovered' })
  total: number;

  @ApiProperty({ description: 'Sites awaiting review' })
  awaitingReview: number;

  @ApiProperty({ description: 'Sites that are scrapable' })
  scrapable: number;

  @ApiProperty({ description: 'Sites with TOS restrictions' })
  tosRestricted: number;

  @ApiPropertyOptional({ description: 'Currently running discovery job' })
  currentJobId?: string;
}

export class DiscoveryResultsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SiteReviewStatus,
  })
  @IsOptional()
  @IsEnum(SiteReviewStatus)
  status?: SiteReviewStatus;
}

export class DiscoveryResultItemDto {
  @ApiProperty() id: string;
  @ApiProperty() url: string;
  @ApiProperty() domain: string;
  @ApiPropertyOptional() title: string;
  @ApiPropertyOptional() snippet: string;
  @ApiPropertyOptional() category: string;
  @ApiProperty() marketplace_confidence: number;
  @ApiProperty({ type: [String] }) ethical_indicators: string[];
  @ApiPropertyOptional() robots_txt_allows_scraping: boolean;
  @ApiPropertyOptional() robots_txt_details: string;
  @ApiPropertyOptional() tos_allows_scraping: boolean;
  @ApiPropertyOptional() tos_details: string;
  @ApiPropertyOptional() tos_url: string;
  @ApiPropertyOptional() is_scrapable: boolean;
  @ApiPropertyOptional() discovery_reasoning: string;
  @ApiProperty({ enum: SiteReviewStatus }) status: SiteReviewStatus;
  @ApiProperty() discovered_at: Date;
  @ApiPropertyOptional() reviewed_at: Date;
  @ApiPropertyOptional() review_notes: string;
}

export class DiscoveryResultsResponseDto {
  @ApiProperty({ type: [DiscoveryResultItemDto] })
  items: DiscoveryResultItemDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class TriggerDiscoveryResponseDto {
  @ApiProperty() message: string;
  @ApiProperty() jobId: string;
}

export class DiscoveryRunStatusResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() status: string;
  @ApiProperty() progress: number;
  @ApiPropertyOptional() triggeredBy?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() result?: any;
}

export class StopDiscoveryResponseDto {
  @ApiProperty({ description: 'Whether the job was successfully stopped' })
  stopped: boolean;
}
