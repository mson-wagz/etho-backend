import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditSourceDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ description: 'Brand display name', required: false })
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiProperty({ description: 'Brand description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Specific collection page URLs to scrape. Leave empty to scrape the entire site via sitemap.',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(200)
  @IsOptional()
  collectionUrls?: string[];
}

export class BrandConfigResponseDto {
  name: string;
  description: string;
  websiteUrl: string;
  collectionUrls: string[];
}
