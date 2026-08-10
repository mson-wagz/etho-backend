import {
  Controller,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MiscellaneousService } from './miscellaneous.service';
import { CurrencyConvertDto } from './dto/currency-convert.dto';
import { CurrencyQueryDto } from './dto/currency-query.dto';
import { InquiryDto } from './dto/inquiry.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
@ApiTags('miscellaneous')
@Controller('miscellaneous')
export class MiscellaneousController {
  constructor(private readonly miscellaneousService: MiscellaneousService) {}

  @Post('inquiries')
  @ApiOperation({ summary: 'Submit a contact inquiry' })
  @ApiResponse({ status: 201, description: 'Inquiry submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async submitInquiry(@Body() body: InquiryDto) {
    try {
      return await this.miscellaneousService.submitInquiry(body);
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error?.message || 'Failed to submit inquiry',
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('currency-convert')
  @ApiOperation({ summary: 'Convert currency amount' })
  @ApiQuery({ name: 'from', required: true, type: String })
  @ApiQuery({ name: 'to', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Currency converted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async convertCurrency(
    @Query() query: CurrencyQueryDto,
    @Body() body: CurrencyConvertDto,
  ) {
    try {
      const convertedAmount = await this.miscellaneousService.convertCurrency(
        body.amount,
        query.from,
        query.to,
      );
      return {
        success: true,
        data: {
          amount: body.amount,
          from: query.from,
          to: query.to,
          convertedAmount,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error?.message || 'Failed to convert currency',
        },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
