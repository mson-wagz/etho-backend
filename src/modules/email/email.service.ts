import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailAdapter,
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from './email.interface';
import { ResendAdapter } from './adapters/resend.adapter';
import { AwsSesAdapter } from './adapters/aws-ses.adapter';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private adapter: EmailAdapter;
  private emailProviderMap: Record<string, EmailAdapter>;

  constructor(
    private configService: ConfigService,
    @Optional() private resendAdapter: ResendAdapter,
    @Optional() private awsSesAdapter: AwsSesAdapter,
  ) {
    this.emailProviderMap = {
      resend: this.resendAdapter,
      'aws-ses': this.awsSesAdapter,
    };

    const provider = this.configService.get<EmailProvider>(
      'EMAIL_PROVIDER',
      'resend',
    );

    this.adapter = this.emailProviderMap[provider] || this.resendAdapter;
    this.logger.log(`Using email provider: ${this.adapter.getName()}`);
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    return this.adapter.sendEmail(options);
  }

  async isAvailable(): Promise<boolean> {
    return this.adapter.isAvailable();
  }

  getProviderName(): string {
    return this.adapter.getName();
  }

  useAdapter(provider: EmailProvider): void {
    const adapter = this.emailProviderMap[provider];
    if (!adapter) {
      throw new Error(`Email provider "${provider}" is not registered`);
    }
    this.adapter = adapter;
    this.logger.log(`Switched to email provider: ${this.adapter.getName()}`);
  }
}
