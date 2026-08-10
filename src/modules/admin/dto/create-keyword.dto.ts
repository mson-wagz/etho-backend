import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateKeywordDto {
  @ApiProperty({
    description: 'Keyword text',
    example: 'organic',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyword: string;

  @ApiProperty({
    description: 'Filter/Category ID that this keyword belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  filter_id: string;
}
