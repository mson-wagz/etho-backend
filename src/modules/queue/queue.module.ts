import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductProcessorService } from './workers/product-processor.service';
import { IngestionCompletionProcessorService } from './workers/ingestion-completion-processor.service';
import { SitesToConfigureQueueProducerService } from './queues/sitesToConfigureQueueProducer.service';
import { SitesToScraperQueueProducerService } from './queues/sitesToScraperQueueProducer.service';
import { SitesToDiscoverQueueProducerService } from './queues/sitesToDiscoverQueueProducer.service';
import { RedisModule } from '../redis/redis.module';
import { MiscellaneousModule } from '../miscellaneous/miscellaneous.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useTls =
          configService.get('NODE_ENV', 'development') !== 'development';
        return {
          connection: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            tls: useTls
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'filtered-products',
    }),
    BullModule.registerQueue({
      name: 'ingestion-completion',
    }),
    BullModule.registerQueue({
      name: 'sites-to-scrape',
    }),
    BullModule.registerQueue({
      name: 'sites-to-configure',
    }),
    BullModule.registerQueue({
      name: 'sites-to-discover',
    }),
    BullModule.registerQueue({
      name: 'products-to-tag',
    }),
    RedisModule,
    MiscellaneousModule,
    ...(process.env.NODE_ENV !== 'production'
      ? [
          BullBoardModule.forFeature({
            name: 'filtered-products',
            adapter: BullMQAdapter,
          }),
          BullBoardModule.forFeature({
            name: 'ingestion-completion',
            adapter: BullMQAdapter,
          }),
          BullBoardModule.forFeature({
            name: 'sites-to-scrape',
            adapter: BullMQAdapter,
          }),
          BullBoardModule.forFeature({
            name: 'sites-to-configure',
            adapter: BullMQAdapter,
          }),
          BullBoardModule.forFeature({
            name: 'sites-to-discover',
            adapter: BullMQAdapter,
          }),
          BullBoardModule.forFeature({
            name: 'products-to-tag',
            adapter: BullMQAdapter,
          }),
        ]
      : []),
  ],
  providers: [
    ProductProcessorService,
    IngestionCompletionProcessorService,
    SitesToConfigureQueueProducerService,
    SitesToScraperQueueProducerService,
    SitesToDiscoverQueueProducerService,
  ],
  exports: [
    BullModule,
    SitesToConfigureQueueProducerService,
    SitesToScraperQueueProducerService,
    SitesToDiscoverQueueProducerService,
  ],
})
export class QueueModule {}
