import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { AnalyticsEventType } from '../types/enums/analytics.enum';

@Injectable()
export class AnalyticsEventRepository extends Repository<AnalyticsEvent> {
  constructor(private dataSource: DataSource) {
    super(AnalyticsEvent, dataSource.createEntityManager());
  }

  async findBySessionId(sessionId: string): Promise<AnalyticsEvent[]> {
    return this.find({ where: { session_id: sessionId } });
  }

  async findByProductId(productId: string): Promise<AnalyticsEvent[]> {
    return this.find({ where: { product_id: productId } });
  }

  async findByEventType(
    eventType: AnalyticsEventType,
  ): Promise<AnalyticsEvent[]> {
    return this.find({ where: { event_type: eventType } });
  }
}
