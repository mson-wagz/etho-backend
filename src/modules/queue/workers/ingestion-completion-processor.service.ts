import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IngestionRunRepository } from '../../../repository/ingestion-run.repository';
import { IngestionStatus } from '../../../common/enums/ingestion.enum';
import { RedisService } from '../../redis/redis.service';

interface IngestionCompletionJob {
  ingestionRunId: string;
  siteId: string;
  productsProcessed?: number;
  completedAt?: string;
  status?: 'failed';
  reason?: string;
  failedAt?: string;
  attempt?: number;
  resumedAt?: string;
  // tagging-error fields
  errorMessage?: string;
  retryAfterSeconds?: number | null;
  timestamp?: string;
}

@Processor('ingestion-completion', {
  concurrency: 2,
})
@Injectable()
export class IngestionCompletionProcessorService extends WorkerHost {
  private readonly logger = new Logger(
    IngestionCompletionProcessorService.name,
  );

  constructor(
    private readonly ingestionRunRepository: IngestionRunRepository,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<IngestionCompletionJob>): Promise<void> {
    const { ingestionRunId, siteId, productsProcessed, reason, attempt } =
      job.data;
    const isFailure = job.name === 'mark-failed';
    const isProgress = job.name === 'mark-in-progress';
    const isTaggingError = job.name === 'tagging-error';

    if (isTaggingError) {
      const { errorMessage, retryAfterSeconds, timestamp } = job.data;
      if (ingestionRunId && errorMessage) {
        await this.redisService.appendIngestionError(ingestionRunId, {
          message: errorMessage,
          retryAfterSeconds: retryAfterSeconds ?? null,
          timestamp: timestamp ?? new Date().toISOString(),
        });
      }
      return;
    }

    this.logger.log(
      isProgress
        ? `Retry attempt ${attempt} for run ${ingestionRunId} (site: ${siteId}) — resetting to in_progress`
        : isFailure
          ? `Processing ingestion failure for run ${ingestionRunId} (site: ${siteId}, reason: ${reason})`
          : `Processing ingestion completion for run ${ingestionRunId} (site: ${siteId}, products: ${productsProcessed})`,
    );

    try {
      await job.updateProgress(20);

      if (isProgress) {
        const runForProgress = await this.ingestionRunRepository.findOne({
          where: { id: ingestionRunId },
        });
        if (runForProgress?.status === IngestionStatus.ABORTED) {
          this.logger.log(
            `Ingestion run ${ingestionRunId} is ABORTED — refusing to reset to in_progress on retry`,
          );
          return;
        }
        await this.ingestionRunRepository.markRunAsInProgress(ingestionRunId);
        await job.updateProgress(100);
        this.logger.log(
          `Reset ingestion run ${ingestionRunId} to in_progress for retry attempt ${attempt}`,
        );
        return;
      }

      const ingestionRun = await this.ingestionRunRepository.findOne({
        where: { id: ingestionRunId },
      });

      if (!ingestionRun) {
        this.logger.warn(`Ingestion run ${ingestionRunId} not found, skipping`);
        return;
      }

      if (ingestionRun.status === IngestionStatus.ABORTED) {
        this.logger.log(
          `Ingestion run ${ingestionRunId} was manually aborted — skipping`,
        );
        return;
      }

      if (
        ingestionRun.status === IngestionStatus.FAILED ||
        ingestionRun.status === IngestionStatus.COMPLETED
      ) {
        this.logger.log(
          `Ingestion run ${ingestionRunId} already in terminal state ${ingestionRun.status} — skipping`,
        );
        return;
      }

      await job.updateProgress(50);

      if (isFailure) {
        await this.ingestionRunRepository.markRunAsFailed(
          ingestionRunId,
          reason ?? 'Tagger reported failure without a reason',
        );
      } else {
        await this.ingestionRunRepository.markRunAsCompleted(ingestionRunId);
      }

      await job.updateProgress(100);

      this.logger.log(
        `Successfully marked ingestion run ${ingestionRunId} as ${isFailure ? 'failed' : 'completed'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process ingestion ${isFailure ? 'failure' : isProgress ? 'progress' : 'completion'} for ${ingestionRunId}:`,
        error,
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<IngestionCompletionJob>, error: Error) {
    this.logger.error(
      `Ingestion completion job ${job.id} failed for run ${job.data.ingestionRunId}:`,
      error.message,
    );
  }
}
