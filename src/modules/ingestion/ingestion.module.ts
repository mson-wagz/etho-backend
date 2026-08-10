import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { CronModule } from '../cron/cron.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [CronModule, QueueModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
