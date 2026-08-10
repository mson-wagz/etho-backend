import {
  IsBoolean,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ScrapingTarget } from 'src/types/consumer';

export class ConfigureSourceDto {
  @IsUrl()
  urlToConfigure: string;

  @IsOptional()
  @IsBoolean()
  overrideTosCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  overrideRobotsCheck?: boolean;
}

export class SaveConfiguredSourceDto {
  @IsBoolean()
  success: boolean;
  @IsUrl()
  urlToConfigure: string;
  @IsString()
  name: string;
  @IsUrl()
  website_url: string;
  @IsString()
  description: string;
  @IsNotEmptyObject()
  config: Omit<ScrapingTarget, 'id'>;
}

export class SaveRegeneratedConfigDto {
  @IsNotEmptyObject()
  config: Omit<ScrapingTarget, 'id'>;
}
