import { Module } from '@nestjs/common';
import { AnalyticsEventController } from './analytics-event.controller';
import { AnalyticsEventService } from './analytics-event.service';

@Module({
  imports: [],
  controllers: [AnalyticsEventController],
  providers: [AnalyticsEventService],
  exports: [AnalyticsEventService],
})
export class AnalyticsModule {}
