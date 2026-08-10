import { DataSource } from 'typeorm';
import { Brand } from '../../entities/brand.entity';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Filter } from '../../entities/filter.entity';
import { FilterKeyword } from '../../entities/filter-keyword.entity';
import { ProductFilter } from '../../entities/product-filter.entity';
import { Certification } from '../../entities/certification.entity';
import { ProductCertification } from '../../entities/product-certification.entity';
import { AnalyticsEvent } from '../../entities/analytics-event.entity';
import { SearchQuery } from '../../entities/search-query.entity';
import { GeneralSettings } from '../../entities/general-settings.entity';
import { User } from '../../entities/user.entity';
import { ScrapingSource } from '../../entities/scraping-source.entity';
import { IngestionRun } from '../../entities/ingestion-run.entity';
import { Meta } from '../../entities/meta.entity';
import { OptionChoice } from '../../entities/option-choice.entity';
import { SiteToReview } from '../../entities/site-to-review.entity';
import { ProductOptionType } from '../../entities/product-option-type.entity';
import { VariantOptionSelection } from '../../entities/variant-option-selection.entity';
import { SourceHistory } from '../../entities/source-history.entity';
import * as fs from 'fs';
import 'dotenv/config';

const getSslConfig = () => {
  if (
    process.env.DB_SSL === 'false' ||
    process.env.NODE_ENV === 'development'
  ) {
    return false;
  }

  // Prefer proper CA validation in production
  if (process.env.DB_SSL_CA_PATH) {
    try {
      const ca = fs.readFileSync(process.env.DB_SSL_CA_PATH).toString();
      return {
        rejectUnauthorized: true,
        ca,
      };
    } catch (error) {
      console.error(
        `Failed to read SSL CA certificate from ${process.env.DB_SSL_CA_PATH}:`,
        error,
      );
      throw new Error(
        `Database SSL CA certificate not found or unreadable at: ${process.env.DB_SSL_CA_PATH}`,
      );
    }
  }

  // Fallback - consider logging a warning here
  console.warn(
    'Database SSL: Using rejectUnauthorized: false. Consider configuring DB_SSL_CA_PATH for production.',
  );
  return { rejectUnauthorized: false };
};

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'etho_user',
  password: process.env.DB_PASSWORD || 'etho_pass',
  database: process.env.DB_NAME || 'etho_db',
  synchronize: false,
  logging: false,
  entities: [
    Brand,
    Category,
    Product,
    ProductVariant,
    OptionChoice,
    ProductOptionType,
    VariantOptionSelection,
    Filter,
    FilterKeyword,
    ProductFilter,
    Certification,
    ProductCertification,
    AnalyticsEvent,
    SearchQuery,
    GeneralSettings,
    User,
    ScrapingSource,
    IngestionRun,
    Meta,
    SiteToReview,
    SourceHistory,
  ],
  migrations: ['dist/migrations/*.js'],
  subscribers: [],
  ssl: getSslConfig(),
});
