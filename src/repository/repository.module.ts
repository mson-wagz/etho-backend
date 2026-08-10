import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandRepository } from './brand.repository';
import { CategoryRepository } from './category.repository';
import { ProductRepository } from './product.repository';
import { ProductVariantRepository } from './product-variant.repository';
import { FilterRepository } from './filter.repository';
import { FilterKeywordRepository } from './filter-keyword.repository';
import { ProductFilterRepository } from './product-filter.repository';
import { CertificationRepository } from './certification.repository';
import { ProductCertificationRepository } from './product-certification.repository';
import { AnalyticsEventRepository } from './analytics-event.repository';
import { SearchQueryRepository } from './search-query.repository';
import { GeneralSettingsRepository } from './general-settings.repository';
import { UserRepository } from './user.repository';
import { ScrapingSourceRepository } from './scraping-source.repository';
import { IngestionRunRepository } from './ingestion-run.repository';
import { MetaRepository } from './meta.repository';
import { SiteToReviewRepository } from './site-to-review.repository';
import { SourceHistoryRepository } from './source-history.repository';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Filter } from '../entities/filter.entity';
import { FilterKeyword } from '../entities/filter-keyword.entity';
import { ProductFilter } from '../entities/product-filter.entity';
import { Certification } from '../entities/certification.entity';
import { ProductCertification } from '../entities/product-certification.entity';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { SearchQuery } from '../entities/search-query.entity';
import { GeneralSettings } from '../entities/general-settings.entity';
import { User } from '../entities/user.entity';
import { ScrapingSource } from '../entities/scraping-source.entity';
import { IngestionRun } from '../entities/ingestion-run.entity';
import { Meta } from '../entities/meta.entity';
import { SiteToReview } from '../entities/site-to-review.entity';
import { SourceHistory } from '../entities/source-history.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      Category,
      Product,
      ProductVariant,
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
    ]),
  ],
  providers: [
    BrandRepository,
    CategoryRepository,
    ProductRepository,
    ProductVariantRepository,
    FilterRepository,
    FilterKeywordRepository,
    ProductFilterRepository,
    CertificationRepository,
    ProductCertificationRepository,
    AnalyticsEventRepository,
    SearchQueryRepository,
    GeneralSettingsRepository,
    UserRepository,
    ScrapingSourceRepository,
    IngestionRunRepository,
    MetaRepository,
    SiteToReviewRepository,
    SourceHistoryRepository,
  ],
  exports: [
    BrandRepository,
    CategoryRepository,
    ProductRepository,
    ProductVariantRepository,
    FilterRepository,
    FilterKeywordRepository,
    ProductFilterRepository,
    CertificationRepository,
    ProductCertificationRepository,
    AnalyticsEventRepository,
    SearchQueryRepository,
    GeneralSettingsRepository,
    UserRepository,
    ScrapingSourceRepository,
    IngestionRunRepository,
    MetaRepository,
    SiteToReviewRepository,
    SourceHistoryRepository,
  ],
})
export class RepositoryModule {}
