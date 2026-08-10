import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import {
  EmailAdapter,
  SendEmailOptions,
  SendEmailResult,
} from '../email.interface';

@Injectable()
export class AwsSesAdapter implements EmailAdapter {
  private readonly logger = new Logger(AwsSesAdapter.name);
  private client: SESClient;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>(
      'AWS_SES_REGION',
      'us-east-1',
    );
    const accessKeyId = this.configService.get<string>('AWS_SES_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SES_SECRET_ACCESS_KEY',
    );

    this.client = new SESClient({
      region,
      ...(accessKeyId &&
        secretAccessKey && {
          credentials: { accessKeyId, secretAccessKey },
        }),
    });

    this.defaultFrom = this.configService.get<string>(
      'EMAIL_DEFAULT_FROM',
      'noreply@example.com',
    );

    this.logger.log(
      `Initialized with region: ${region}, default from: ${this.defaultFrom}`,
    );
  }

  getName(): string {
    return 'aws-ses';
  }

  async isAvailable(): Promise<boolean> {
    const region = this.configService.get<string>('AWS_SES_REGION');
    return !!region;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.from || this.defaultFrom;
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    const ccAddresses = options.cc
      ? Array.isArray(options.cc)
        ? options.cc
        : [options.cc]
      : undefined;
    const bccAddresses = options.bcc
      ? Array.isArray(options.bcc)
        ? options.bcc
        : [options.bcc]
      : undefined;

    this.logger.debug(`Sending email via AWS SES to ${toAddresses.join(', ')}`);

    const input: SendEmailCommandInput = {
      Source: from,
      ConfigurationSetName: this.configService.get<string>(
        'AWS_SES_CONFIGURATION_SET',
        'etho-default-sending-config'
      ),
      Destination: {
        ToAddresses: toAddresses,
        ...(ccAddresses && { CcAddresses: ccAddresses }),
        ...(bccAddresses && { BccAddresses: bccAddresses }),
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          ...(options.html && {
            Html: { Data: options.html, Charset: 'UTF-8' },
          }),
          ...(options.text && {
            Text: { Data: options.text, Charset: 'UTF-8' },
          }),
        },
      },
      ...(options.replyTo && { ReplyToAddresses: [options.replyTo] }),
      ...(options.tags && {
        Tags: Object.entries(options.tags).map(([Name, Value]) => ({
          Name,
          Value,
        })),
      }),
    };

    const command = new SendEmailCommand(input);
    const result = await this.client.send(command);

    this.logger.debug(`Email sent, MessageId: ${result.MessageId}`);

    return {
      id: result.MessageId,
      success: true,
    };
  }
}
