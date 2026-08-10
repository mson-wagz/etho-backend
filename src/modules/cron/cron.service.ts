import { Injectable } from '@nestjs/common';
import { SchedulerRegistry, Cron, CronExpression } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { MiscellaneousService } from '../miscellaneous/miscellaneous.service';

@Injectable()
export class CronService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private miscallaneousService: MiscellaneousService,
  ) {}

  async createCronJob(name: string, cronTime: string, callback: () => void) {
    const existingJob = this.schedulerRegistry.doesExist('cron', name);
    if (existingJob) {
      const job = this.schedulerRegistry.getCronJob(name);
      await job.stop();
      this.schedulerRegistry.deleteCronJob(name);
    }

    const job = new CronJob(cronTime, callback);
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  isCronJobActive(name: string): boolean {
    if (this.schedulerRegistry.doesExist('cron', name)) {
      const job = this.schedulerRegistry.getCronJob(name);
      return job.isActive;
    }
    return false;
  }

  async deleteCronJob(name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    if (job) {
      await job.stop();
      this.schedulerRegistry.deleteCronJob(name);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateExchangeRates() {
    try {
      await this.miscallaneousService.updateExchangeRates();
      console.log('Exchange rates updated successfully');
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
    }
  }
}
