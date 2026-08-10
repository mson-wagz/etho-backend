import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { CrawlJobData } from 'src/types/consumer';

@Injectable()
export class SitesToScraperQueueProducerService {
  private readonly logger = new Logger(SitesToScraperQueueProducerService.name);

  constructor(
    @InjectQueue('sites-to-scrape')
    private readonly crawlerQueue: Queue<CrawlJobData>,
    @InjectQueue('products-to-tag')
    private readonly productsToTagQueue: Queue,
    @InjectQueue('filtered-products')
    private readonly filteredProductsQueue: Queue,
    @InjectQueue('ingestion-completion')
    private readonly ingestionCompletionQueue: Queue,
  ) {}

  async addCrawlJob(
    brandName: string,
    options?: CrawlJobData & {
      delay?: number;
    },
  ): Promise<string> {
    try {
      const jobData: CrawlJobData = {
        brandName,
        brandId: options?.brandId,
        triggeredBy: options?.triggeredBy || 'manual',
        priority: options?.priority || 1,
        ingestionRunId: options?.ingestionRunId,
        ingestionMode: options?.ingestionMode,
      };

      const job = await this.crawlerQueue.add(`crawl-${brandName}`, jobData, {
        jobId: `crawl-${brandName}-${Date.now()}`,
        priority: options?.priority,
        delay: options?.delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with 1 minute delay
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      });

      this.logger.log(`Added crawl job ${job.id} for ${brandName} to queue`);

      return job.id!;
    } catch (error) {
      console.error(`Failed to add crawl job for ${brandName}:`, error);
      throw new Error(`Failed to add crawl job for ${brandName}`);
    }
  }

  async addBulkCrawlJobs(
    options: (CrawlJobData & {
      delay?: number;
    })[],
  ): Promise<string[]> {
    const jobs = options?.map((option) => ({
      name: `crawl-${option.brandName}`,
      data: {
        brandName: option.brandName,
        brandId: option.brandId,
        ingestionMode: option.ingestionMode,
        ingestionRunId: option.ingestionRunId,
        triggeredBy: option.triggeredBy || 'bulk',
        priority: option.priority || 1,
        delay: option.delay,
      } as CrawlJobData,
      opts: {
        jobId: `crawl-${option.brandName}-${Date.now()}`, // Prevents duplicate jobs for same brand
        priority: option.priority,
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 60000,
        },
      },
    }));

    try {
      const addedJobs = await this.crawlerQueue.addBulk(jobs);
      const jobIds = addedJobs.map((job) => job.id!);

      this.logger.log(
        `Added ${jobIds.length} crawl jobs to queue (triggered by: ${options.map((option) => option.triggeredBy).join(', ') || 'bulk'})`,
      );

      return jobIds;
    } catch (error) {
      console.error(`Failed to add bulk crawl jobs:`, error);
      throw new Error(`Failed to add bulk crawl jobs`);
    }
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.crawlerQueue.getWaitingCount(),
      this.crawlerQueue.getActiveCount(),
      this.crawlerQueue.getCompletedCount(),
      this.crawlerQueue.getFailedCount(),
      this.crawlerQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async getJob(jobId: string) {
    return this.crawlerQueue.getJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.crawlerQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Removed job ${jobId} from queue`);
    }
  }

  async pauseQueue(): Promise<void> {
    await this.crawlerQueue.pause();
    this.logger.log('Crawler queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.crawlerQueue.resume();

    this.logger.log('Crawler queue resumed');
  }

  async clearQueue(): Promise<void> {
    await this.crawlerQueue.drain();
    this.logger.log('Crawler queue cleared');
  }

  async setAbortFlag(ingestionRunId: string): Promise<void> {
    const client = await this.crawlerQueue.client;
    await client.set(`crawl:abort:${ingestionRunId}`, '1', 'EX', 3600);
    this.logger.log(`Set abort flag for ingestion run ${ingestionRunId}`);
  }

  async drainJobsByIngestionRunId(ingestionRunId: string): Promise<void> {
    const queues = [
      this.productsToTagQueue,
      this.filteredProductsQueue,
      this.ingestionCompletionQueue,
    ];

    for (const queue of queues) {
      const jobs: Job[] = await queue.getJobs(
        ['waiting', 'delayed', 'prioritized'],
        0,
        -1,
      );
      const toRemove = jobs.filter(
        (j) => j.data?.ingestionRunId === ingestionRunId,
      );
      await Promise.all(toRemove.map((j) => j.remove()));
      if (toRemove.length > 0) {
        this.logger.log(
          `Removed ${toRemove.length} jobs from queue '${queue.name}' for ingestion run ${ingestionRunId}`,
        );
      }
    }
  }
}
