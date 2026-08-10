import { ScrapingTarget } from './consumer';

export enum SiteConfigStep {
  URL_VALIDATION = 'url_validation',
  TERMS_OF_SERVICE_CHECK = 'terms_of_service_check',
  SITEMAP_DISCOVERY = 'sitemap_discovery',
  ROBOTS_TXT_CHECK = 'robots_txt_check',
  SELECTOR_GENERATION = 'selector_generation',
  COMPLETED = 'completed',
}

export interface SiteConfigJobData {
  urlToConfigure: string;
  triggeredBy?: string;
  priority?: number;
  overrideTosCheck?: boolean;
  overrideRobotsCheck?: boolean;
}

export interface SiteConfigJobProgress {
  currentStepIndex: number;
  currentStep: SiteConfigStep;
  currentStepDetails: string;
  stepErrors?: Partial<Record<SiteConfigStep, string>>;
  percentage?: number;
}

export interface SiteConfigJobStatus {
  id: string;
  status: 'running' | 'completed' | 'standby' | 'failed';
  currentStepIndex: number;
  currentStep: SiteConfigStep;
  currentStepDetails: string;
  stepErrors?: Partial<Record<SiteConfigStep, string>>;
  urlToConfigure: string;
  createdAt: Date;
  updatedAt: Date;
  result?: SiteConfigJobResult;
}

export interface SiteConfigJobResult {
  success: boolean;
  urlToConfigure: string;
  name: string;
  website_url: string;
  description: string;
  config: Omit<ScrapingTarget, 'id'>;
}
