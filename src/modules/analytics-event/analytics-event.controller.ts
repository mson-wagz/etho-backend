import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { AnalyticsEventService } from './analytics-event.service';
import {
  CreateAnalyticsEventDto,
  AnalyticsEventResponseDto,
} from './dto/analytics-event.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsEventController {
  constructor(private readonly analyticsEventService: AnalyticsEventService) {}

  @Post('events')
  @ApiOperation({ summary: 'Create an analytics event' })
  @ApiBody({ type: CreateAnalyticsEventDto })
  @ApiResponse({
    status: 201,
    description: 'Analytics event created successfully',
    type: AnalyticsEventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @Req() req: Request,
    @Body() createAnalyticsEvent: CreateAnalyticsEventDto,
  ): Promise<AnalyticsEventResponseDto> {
    const sessionId = req.sessionId;

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const result = await this.analyticsEventService.createAnalyticsEvent({
      ...createAnalyticsEvent,
      session_id: sessionId,
    });

    return {
      success: true,
      data: {
        event_id: result.event.id,
        session_id: result.event.session_id,
        created_at: result.event.created_at,
      },
    };
  }
}
