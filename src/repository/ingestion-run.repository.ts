import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IngestionRun } from '../entities/ingestion-run.entity';
import { IngestionStatus } from 'src/common/enums/ingestion.enum';

@Injectable()
export class IngestionRunRepository extends Repository<IngestionRun> {
  constructor(private dataSource: DataSource) {
    super(IngestionRun, dataSource.createEntityManager());
  }

  async findByBrandId(brandId: string): Promise<IngestionRun[]> {
    return this.find({ where: { brand_id: brandId } });
  }

  async findByStatus(status: string): Promise<IngestionRun[]> {
    return this.find({ where: { status } });
  }

  async updateIngestionRun(
    id: string,
    updateData: Partial<IngestionRun>,
  ): Promise<void> {
    await this.update(id, updateData);
  }

  async markRunAsCompleted(ingestionRunId: string): Promise<void> {
    const ingestionRun = await this.findOne({ where: { id: ingestionRunId } });
    if (!ingestionRun) {
      throw new Error(`Ingestion run with ID ${ingestionRunId} not found`);
    }

    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - ingestionRun.started_at.getTime()) / 1000,
    );
    await this.update(ingestionRunId, {
      status: IngestionStatus.COMPLETED,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
    });
  }

  async markRunAsFailed(ingestionRunId: string, reason: string): Promise<void> {
    const ingestionRun = await this.findOne({ where: { id: ingestionRunId } });
    if (!ingestionRun) return;

    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - ingestionRun.started_at.getTime()) / 1000,
    );
    const existingErrors = ingestionRun.errors ?? [];
    await this.update(ingestionRunId, {
      status: IngestionStatus.FAILED,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
      errors: [
        ...existingErrors,
        {
          message: reason,
          timestamp: completedAt.toISOString(),
        },
      ],
    });
  }

  async markRunAsInProgress(ingestionRunId: string): Promise<void> {
    const ingestionRun = await this.findOne({ where: { id: ingestionRunId } });
    if (!ingestionRun) return;
    if (ingestionRun.status === IngestionStatus.ABORTED) return;
    await this.update(ingestionRunId, {
      status: IngestionStatus.IN_PROGRESS,
      completed_at: undefined,
    });
  }

  async markRunAsAborted(ingestionRunId: string): Promise<void> {
    const ingestionRun = await this.findOne({ where: { id: ingestionRunId } });
    if (!ingestionRun) return;

    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - ingestionRun.started_at.getTime()) / 1000,
    );
    const existingErrors = ingestionRun.errors ?? [];
    await this.update(ingestionRunId, {
      status: IngestionStatus.ABORTED,
      completed_at: completedAt,
      duration_seconds: durationSeconds,
      errors: [
        ...existingErrors,
        {
          message: 'Manually stopped by user',
          timestamp: completedAt.toISOString(),
        },
      ],
    });
  }
}
