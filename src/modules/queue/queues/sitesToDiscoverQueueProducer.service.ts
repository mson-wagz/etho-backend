import { Injectable, Logger } from '@nestjs/common';
import {
  InjectQueue,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  DiscoveryJobData,
  DiscoveryJobResult,
  DiscoveryJobStatus,
} from 'src/types/discovery';
import { RedisService } from '../../redis/redis.service';

@Injectable()
@QueueEventsListener('sites-to-discover')
export class SitesToDiscoverQueueProducerService extends QueueEventsHost {
  private readonly logger = new Logger(
    SitesToDiscoverQueueProducerService.name,
  );

  constructor(
    @InjectQueue('sites-to-discover')
    private readonly discoverQueue: Queue<DiscoveryJobData, DiscoveryJobResult>,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async addDiscoveryJob(options?: {
    maxQueries?: number;
    excludedDomains?: string[];
    triggeredBy?: string;
    priority?: number;
    delay?: number;
  }): Promise<string> {
    const activeJobs = await this.discoverQueue.getActive();
    const standbyJobs = await this.discoverQueue.getWaiting();

    if (activeJobs.length > 0 || standbyJobs.length > 0) {
      return standbyJobs.length > 0 ? standbyJobs[0].id! : activeJobs[0].id!;
    }

    const jobData: DiscoveryJobData = {
      maxQueries: options?.maxQueries,
      triggeredBy: options?.triggeredBy || 'manual',
      excludedDomains: options?.excludedDomains,
    };

    const jobId = `discover-${Date.now()}`;
    const job = await this.discoverQueue.add(
      `discover-${Date.now()}`,
      jobData,
      {
        jobId,
        priority: options?.priority,
        delay: options?.delay,
        attempts: 1,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
        removeOnComplete: {
          age: 86400,
          count: 100,
        },
        removeOnFail: {
          age: 604800,
        },
      },
    );

    this.logger.log(
      `Added discovery job ${job.id} to queue (triggered by: ${jobData.triggeredBy})`,
    );

    return job.id!;
  }

  async stopDiscovery(jobId: string): Promise<{ stopped: boolean }> {
    try {
      const activeJobs = await this.discoverQueue.getActive();
      const activeJob = activeJobs.find((j) => j.id === jobId);
      if (activeJob) {
        await this.redisService.setDiscoveryStopFlag(jobId);
        this.logger.log(
          `Set stop flag for active discovery job ${jobId} — worker will halt at next checkpoint`,
        );
        return { stopped: true };
      }

      const waitingJobs = await this.discoverQueue.getWaiting();
      const waitingJob = waitingJobs.find((j) => j.id === jobId);
      if (waitingJob) {
        await waitingJob.remove();
        this.logger.log(`Removed waiting discovery job ${jobId}`);
        return { stopped: true };
      }

      this.logger.warn(
        `Discovery job ${jobId} not found in active or waiting state`,
      );
      return { stopped: false };
    } catch (error) {
      this.logger.error(`Error stopping discovery job ${jobId}: ${error}`);
      return { stopped: false };
    }
  }

  async getJobDetails(jobId: string): Promise<DiscoveryJobStatus | null> {
    const job = await this.discoverQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;

    let status: 'running' | 'completed' | 'standby' | 'failed' = 'standby';
    if (state === 'active') {
      status = 'running';
    } else if (state === 'completed') {
      status = 'completed';
    } else if (state === 'failed') {
      status = 'failed';
    }

    return {
      id: job.id!,
      status,
      progress,
      triggeredBy: job.data.triggeredBy,
      createdAt: new Date(job.timestamp),
      updatedAt: new Date(job.processedOn ?? job.timestamp),
      result: state === 'completed' ? job.returnvalue : undefined,
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.discoverQueue.getWaitingCount(),
      this.discoverQueue.getActiveCount(),
      this.discoverQueue.getCompletedCount(),
      this.discoverQueue.getFailedCount(),
      this.discoverQueue.getDelayedCount(),
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

  async getJobsByStatus(status: 'waiting' | 'active' | 'completed' | 'failed') {
    const jobs =
      status === 'waiting'
        ? await this.discoverQueue.getWaiting()
        : status === 'active'
          ? await this.discoverQueue.getActive()
          : status === 'completed'
            ? await this.discoverQueue.getCompleted()
            : await this.discoverQueue.getFailed();

    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id!,
        triggeredBy: job.data.triggeredBy,
        status,
        createdAt: new Date(job.timestamp),
      })),
    );
  }
}
