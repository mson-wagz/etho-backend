import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from './common/config/db.config';
import { ConfigModule } from '@nestjs/config';
import { RepositoryModule } from './repository/repository.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CertificationModule } from './modules/certifications/certification.module';
import { FiltersModule } from './modules/filters/filters.module';
import { AnalyticsModule } from './modules/analytics-event/analytics-event.module';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { QueueModule } from './modules/queue/queue.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsEventController } from './modules/analytics-event/analytics-event.controller';
import { ProductsController } from './modules/products/products.controller';
import { CronModule } from './modules/cron/cron.module';
import { MiscellaneousModule } from './modules/miscellaneous/miscellaneous.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSource.options,
    }),
    RepositoryModule,
    CategoriesModule,
    ProductsModule,
    CertificationModule,
    FiltersModule,
    AnalyticsModule,
    RedisModule,
    AuthModule,
    IngestionModule,
    AdminModule,
    QueueModule,
    ...(process.env.NODE_ENV !== 'production'
      ? [
          BullBoardModule.forRoot({
            route: '/admin/queues',
            adapter: ExpressAdapter,
          }),
        ]
      : []),
    CronModule,
    MiscellaneousModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionMiddleware)
      .forRoutes(AnalyticsEventController, ProductsController);
  }
}
