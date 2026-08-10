import { Injectable, Logger } from '@nestjs/common';
import {
  InjectQueue,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  SiteConfigJobData,
  SiteConfigJobStatus,
  SiteConfigStep,
  SiteConfigJobProgress,
  SiteConfigJobResult,
} from 'src/types/siteConfig';

@Injectable()
@QueueEventsListener('sites-to-configure')
export class SitesToConfigureQueueProducerService extends QueueEventsHost {
  private readonly logger = new Logger(
    SitesToConfigureQueueProducerService.name,
  );

  constructor(
    @InjectQueue('sites-to-configure')
    private readonly configQueue: Queue<SiteConfigJobData, SiteConfigJobResult>,
  ) {
    super();
  }

  async addConfigJob(
    urlToConfigure: string,
    options?: {
      triggeredBy?: string;
      priority?: number;
      delay?: number;
      overrideTosCheck?: boolean;
      overrideRobotsCheck?: boolean;
    },
  ): Promise<string> {
    const jobData: SiteConfigJobData = {
      urlToConfigure,
      triggeredBy: options?.triggeredBy || 'manual',
      priority: options?.priority || 1,
      overrideTosCheck: options?.overrideTosCheck || false,
      overrideRobotsCheck: options?.overrideRobotsCheck || false,
    };

    const job = await this.configQueue.add(
      `configure-${this.sanitizeUrlForJobId(urlToConfigure)}-${Date.now()}`,
      jobData,
      {
        jobId: `configure-${this.sanitizeUrlForJobId(urlToConfigure)}-${Date.now()}`,
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
      `Added config job ${job.id} for ${urlToConfigure} to queue`,
    );

    return job.id!;
  }

  async addBulkConfigJobs(
    urlsToConfigure: string[],
    options?: {
      triggeredBy?: string;
      priority?: number;
    },
  ): Promise<string[]> {
    const jobs = urlsToConfigure.map((urlToConfigure) => ({
      name: `configure-${this.sanitizeUrlForJobId(urlToConfigure)}-${Date.now()}`,
      data: {
        urlToConfigure,
        triggeredBy: options?.triggeredBy || 'bulk',
        priority: options?.priority || 1,
      } as SiteConfigJobData,
      opts: {
        jobId: `configure-${this.sanitizeUrlForJobId(urlToConfigure)}-${Date.now()}`,
        priority: options?.priority,
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 60000,
        },
      },
    }));

    const addedJobs = await this.configQueue.addBulk(jobs);
    const jobIds = addedJobs.map((job) => job.id!);

    this.logger.log(
      `Added ${jobIds.length} config jobs to queue (triggered by: ${options?.triggeredBy || 'bulk'})`,
    );

    return jobIds;
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.configQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    this.logger.log(`Removed job ${jobId} from queue`);
  }

  async getJobDetails(jobId: string): Promise<SiteConfigJobStatus | null> {
    const job = await this.configQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress as SiteConfigJobProgress | undefined;

    let status: 'running' | 'completed' | 'standby' | 'failed' = 'standby';
    if (state === 'active') {
      status = 'running';
    } else if (state === 'completed') {
      status = 'completed';
    } else if (state === 'failed') {
      status = 'failed';
    }

    const currentStepIndex = progress?.currentStepIndex ?? 0;
    const currentStep = progress?.currentStep ?? SiteConfigStep.URL_VALIDATION;
    const currentStepDetails =
      progress?.currentStepDetails ?? 'Job queued, waiting to start';
    const stepErrors = progress?.stepErrors ?? {};

    return {
      id: job.id!,
      status,
      currentStepIndex,
      currentStep,
      currentStepDetails,
      stepErrors,
      urlToConfigure: job.data.urlToConfigure,
      createdAt: new Date(job.timestamp),
      updatedAt: new Date(job.processedOn ?? job.timestamp),
      result: state === 'completed' ? job.returnvalue : undefined,
    };
  }

  async getMultipleJobDetails(
    jobIds: string[],
  ): Promise<SiteConfigJobStatus[]> {
    const jobs = await Promise.all(jobIds.map((id) => this.getJobDetails(id)));

    return jobs.filter((job): job is SiteConfigJobStatus => job !== null);
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.configQueue.getWaitingCount(),
      this.configQueue.getActiveCount(),
      this.configQueue.getCompletedCount(),
      this.configQueue.getFailedCount(),
      this.configQueue.getDelayedCount(),
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
        ? await this.configQueue.getWaiting()
        : status === 'active'
          ? await this.configQueue.getActive()
          : status === 'completed'
            ? await this.configQueue.getCompleted()
            : await this.configQueue.getFailed();

    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id!,
        urlToConfigure: job.data.urlToConfigure,
        status,
        createdAt: new Date(job.timestamp),
      })),
    );
  }

  private sanitizeUrlForJobId(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9-_.]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }
}
