import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface StreamMessage {
  id: string;
  data: Record<string, string>;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD', '');

    const useTls =
      this.configService.get<string>('NODE_ENV', 'development') !==
      'development';

    this.client = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      tls: useTls
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.registerEventListeners();
  }

  getClient(): Redis {
    return this.client;
  }

  async getIngestionProgress(ingestionRunId: string): Promise<{
    stage: string;
    collectionTotal: number;
    collectionProcessed: number;
    productsParsed: number;
    productsProcessed: number;
    productsCreated: number;
    productsUpdated: number;
    productsSkipped: number;
    productsErrored: number;
    errors?: Array<{
      message: string;
      retryAfterSeconds: number | null;
      timestamp: string;
    }>;
  } | null> {
    const key = `crawl:progress:${ingestionRunId}`;
    const data = await this.client.hgetall(key);
    if (!data || Object.keys(data).length === 0) return null;
    const errorKey = `ingestion:errors:${ingestionRunId}`;
    const rawErrors = await this.client.lrange(errorKey, 0, -1);
    const errors = rawErrors.map((e) => JSON.parse(e));
    return {
      stage: data.stage || 'crawling',
      collectionTotal: parseInt(data.collectionTotal || '0', 10),
      collectionProcessed: parseInt(data.collectionProcessed || '0', 10),
      productsParsed: parseInt(data.productsParsed || '0', 10),
      productsProcessed: parseInt(data.productsProcessed || '0', 10),
      productsCreated: parseInt(data.productsCreated || '0', 10),
      productsUpdated: parseInt(data.productsUpdated || '0', 10),
      productsSkipped: parseInt(data.productsSkipped || '0', 10),
      productsErrored: parseInt(data.productsErrored || '0', 10),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async setDiscoveryStopFlag(jobId: string): Promise<void> {
    await this.client.set(`discovery:stop:${jobId}`, '1', 'EX', 600);
  }

  async appendIngestionError(
    ingestionRunId: string,
    error: {
      message: string;
      retryAfterSeconds: number | null;
      timestamp: string;
    },
  ): Promise<void> {
    const key = `ingestion:errors:${ingestionRunId}`;
    await this.client.rpush(key, JSON.stringify(error));
    await this.client.expire(key, 86400);
  }

  async incrementIngestionProductProcessed(
    ingestionRunId: string,
  ): Promise<void> {
    if (!ingestionRunId) return;
    const key = `crawl:progress:${ingestionRunId}`;
    await this.client.hincrby(key, 'productsProcessed', 1);
  }

  async incrementIngestionProductCreated(
    ingestionRunId: string,
  ): Promise<void> {
    if (!ingestionRunId) return;
    const key = `crawl:progress:${ingestionRunId}`;
    await this.client.hincrby(key, 'productsCreated', 1);
  }

  async incrementIngestionProductUpdated(
    ingestionRunId: string,
  ): Promise<void> {
    if (!ingestionRunId) return;
    const key = `crawl:progress:${ingestionRunId}`;
    await this.client.hincrby(key, 'productsUpdated', 1);
  }

  async incrementIngestionProductSkipped(
    ingestionRunId: string,
  ): Promise<void> {
    if (!ingestionRunId) return;
    const key = `crawl:progress:${ingestionRunId}`;
    await this.client.hincrby(key, 'productsSkipped', 1);
  }

  async incrementIngestionProductErrored(
    ingestionRunId: string,
  ): Promise<void> {
    if (!ingestionRunId) return;
    const key = `crawl:progress:${ingestionRunId}`;
    await this.client.hincrby(key, 'productsErrored', 1);
  }

  async setCrawlProgressStage(
    ingestionRunId: string,
    stage: 'crawling' | 'saving' | 'done',
  ): Promise<void> {
    if (!ingestionRunId) return;
    const key = `crawl:progress:${ingestionRunId}`;
    await this.client.hset(key, 'stage', stage);
  }

  private registerEventListeners() {
    this.client.on('connect', () => {
      this.logger.log('Connected to Redis server');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis error:', error);
    });

    this.client.on('end', () => {
      this.logger.log('Disconnected from Redis server');
    });
  }
}
