export type EmailProvider = 'resend' | 'aws-ses';

/**
 * Base interface for email adapters.
 * All email providers (Resend, AWS SES, etc.) must implement this interface.
 */
export interface EmailAdapter {
  /**
   * Send an email using this provider.
   * @param options - Email send options
   * @returns Result containing the message ID and success status
   */
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Check if the adapter is properly configured and ready to use.
   * @returns True if the adapter can send emails
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the name of this adapter for logging purposes.
   */
  getName(): string;
}

export interface SendEmailOptions {
  /**
   * Recipient email address(es)
   */
  to: string | string[];

  /**
   * Sender email address (falls back to EMAIL_DEFAULT_FROM env var)
   */
  from?: string;

  /**
   * Email subject line
   */
  subject: string;

  /**
   * HTML body content
   */
  html?: string;

  /**
   * Plain-text body content (used as fallback when html is not provided)
   */
  text?: string;

  /**
   * CC recipient(s)
   */
  cc?: string | string[];

  /**
   * BCC recipient(s)
   */
  bcc?: string | string[];

  /**
   * Reply-to address
   */
  replyTo?: string;

  /**
   * File attachments
   */
  attachments?: EmailAttachment[];

  /**
   * Arbitrary key/value tags for tracking (provider support varies)
   */
  tags?: Record<string, string>;
}

export interface EmailAttachment {
  /**
   * File name shown to the recipient
   */
  filename: string;

  /**
   * File content as a base64 string or Buffer
   */
  content: string | Buffer;

  /**
   * MIME type of the attachment (e.g. 'application/pdf')
   */
  contentType?: string;
}

export interface SendEmailResult {
  /**
   * Provider-assigned message ID (if available)
   */
  id?: string;

  /**
   * Whether the send call succeeded
   */
  success: boolean;
}

export interface EmailModuleConfig {
  /**
   * Which adapter to use
   */
  provider: EmailProvider;

  /**
   * Resend-specific configuration
   */
  resend?: {
    apiKey: string;
    defaultFrom?: string;
  };

  /**
   * AWS SES-specific configuration
   */
  awsSes?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    defaultFrom?: string;
  };
}
