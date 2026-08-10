import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateEmailOptions, Resend } from 'resend';
import {
  EmailAdapter,
  SendEmailOptions,
  SendEmailResult,
} from '../email.interface';

@Injectable()
export class ResendAdapter implements EmailAdapter {
  private readonly logger = new Logger(ResendAdapter.name);
  private client: Resend;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured');
      return;
    }
    this.client = new Resend(apiKey);
    this.defaultFrom = this.configService.get<string>(
      'EMAIL_DEFAULT_FROM',
      'noreply@example.com',
    );
    this.logger.log(`Initialized with default from: ${this.defaultFrom}`);
  }

  getName(): string {
    return 'resend';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.from || this.defaultFrom;
    const recipients = Array.isArray(options.to)
      ? options.to.join(', ')
      : options.to;

    this.logger.debug(`Sending email via Resend to ${recipients}`);

    const payload = {
      from,
      to: options.to,
      subject: options.subject,
      ...(options.html !== undefined && { html: options.html }),
      ...(options.text !== undefined && { text: options.text }),
      ...(options.cc !== undefined && { cc: options.cc }),
      ...(options.bcc !== undefined && { bcc: options.bcc }),
      ...(options.replyTo !== undefined && { replyTo: options.replyTo }),
      ...(options.attachments && {
        attachments: options.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          content_type: a.contentType,
        })),
      }),
      ...(options.tags && {
        tags: Object.entries(options.tags).map(([name, value]) => ({
          name,
          value,
        })),
      }),
    } as CreateEmailOptions;

    const { data, error } = await this.client.emails.send(payload);

    if (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new Error(`Resend error: ${error.message}`);
    }

    return {
      id: data?.id,
      success: true,
    };
  }
}
