import { Module } from '@nestjs/common';
import { AdminFiltersController } from './controllers/admin-filters.controller';
import { AdminIngestionController } from './controllers/admin-ingestion.controller';
import { AdminGeneralSettingsController } from './controllers/admin-general-settings.controller';
import { AdminCertificationsController } from './controllers/admin-certifications.controller';
import { AdminKeywordsController } from './controllers/admin-keywords.controller';
import { AdminDiscoveryController } from './controllers/admin-discovery.controller';
import { AdminService } from './services/admin.service';
import { FilterService } from '../filters/filters.service';
import { IngestionModule } from '../ingestion/ingestion.module';
import { QueueModule } from '../queue/queue.module';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { AnalyticsModule } from '../analytics-event/analytics-event.module';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { ProductsService } from '../products/products.service';
import { AdminProductsController } from './controllers/admin-products.controller';
import { SiteToReviewRepository } from '../../repository/site-to-review.repository';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [IngestionModule, AnalyticsModule, QueueModule, RedisModule],
  controllers: [
    AdminFiltersController,
    AdminIngestionController,
    AdminAnalyticsController,
    AdminProductsController,
    AdminGeneralSettingsController,
    AdminCertificationsController,
    AdminKeywordsController,
    AdminDiscoveryController,
  ],
  providers: [
    AdminService,
    ProductsService,
    FilterService,
    AdminGuard,
    JwtAuthGuard,
    AdminRoleGuard,
    SiteToReviewRepository,
  ],
  exports: [AdminService],
})
export class AdminModule {}
