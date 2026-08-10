import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MiscellaneousModule } from '../miscellaneous/miscellaneous.module';

@Module({
  imports: [ScheduleModule.forRoot(), MiscellaneousModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
