import { ApiProperty } from '@nestjs/swagger';

export class AdminCertificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  certifying_body: string;

  @ApiProperty({ nullable: true })
  description: string | null;
}

export class AdminFilterKeywordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  keyword: string;
}

export class AdminFilterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  tier: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  priority: number;

  @ApiProperty({ type: [AdminCertificationDto] })
  certifications: AdminCertificationDto[];

  @ApiProperty({ type: [AdminFilterKeywordDto] })
  keywords: AdminFilterKeywordDto[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class AdminFilterSettingsResponseDto {
  @ApiProperty({ type: [AdminFilterDto] })
  filters: AdminFilterDto[];

  @ApiProperty()
  counts: {
    total_filters: number;
    total_certifications: number;
    total_keywords: number;
  };
}
