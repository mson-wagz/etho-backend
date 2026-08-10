import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendAdapter } from './adapters/resend.adapter';
import { AwsSesAdapter } from './adapters/aws-ses.adapter';

@Global()
@Module({
  providers: [EmailService, ResendAdapter, AwsSesAdapter],
  exports: [EmailService],
})
export class EmailModule {}
