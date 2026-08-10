import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MetaRepository } from '../../repository/meta.repository';
import { MetaKeys } from '../../common/enums/meta.enum';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { buildInquiryEmailBody } from '../../common/utils/email.util';
import { InquiryDto } from './dto/inquiry.dto';

@Injectable()
export class MiscellaneousService {
  private readonly inquiryRecipient = 'hello@theetho.com';

  constructor(
    private metaRepository: MetaRepository,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async getConversionRates(): Promise<Record<string, number>> {
    let meta = await this.metaRepository.findByKey(MetaKeys.CONVERSION_RATE);
    if (!meta) {
      await this.updateExchangeRates();
      meta = await this.metaRepository.findByKey(MetaKeys.CONVERSION_RATE);
      if (!meta) {
        throw new InternalServerErrorException('Exchange rates not available');
      }
    }

    try {
      return JSON.parse(meta.value);
    } catch {
      throw new BadRequestException('Exchange rates data is corrupted');
    }
  }

  async convertCurrency(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    const rates = await this.getConversionRates();

    if (!rates[from] || !rates[to]) {
      throw new BadRequestException('Invalid currency code');
    }

    const amountInUSD = amount / rates[from];
    const convertedAmount = amountInUSD * rates[to];

    return convertedAmount;
  }

  async submitInquiry(
    dto: InquiryDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const html = buildInquiryEmailBody({
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
      });

      await this.emailService.sendEmail({
        to: this.inquiryRecipient,
        from: `Etho <info@theetho.com>`,
        subject: `New Inquiry: ${dto.subject}`,
        html,
        replyTo: dto.email,
      });

      return { success: true, message: 'Inquiry submitted successfully' };
    } catch (error) {
      console.error('Error sending inquiry email:', error);
      throw new InternalServerErrorException(
        'Failed to submit inquiry. Please try again later.',
      );
    }
  }

  async updateExchangeRates(): Promise<void> {
    const apiKey = this.configService.get<string>('EXCHANGE_RATE_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Exchange rate API key not configured',
      );
    }

    let data: { result: string; conversion_rates?: Record<string, number> };
    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
        { signal: AbortSignal.timeout(10000) },
      );
      data = await response.json();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch exchange rates from external API',
      );
    }

    if (data.result === 'success') {
      await this.metaRepository.upsertMeta(
        MetaKeys.CONVERSION_RATE,
        JSON.stringify(data.conversion_rates),
      );
    } else {
      throw new InternalServerErrorException('Failed to fetch exchange rates');
    }
  }
}
