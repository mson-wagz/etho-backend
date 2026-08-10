import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/admin.guard';
import {
  AnalyticsStatsDto,
  ProductPerformanceResponseDto,
} from 'src/modules/analytics-event/dto/analytics-event.dto';
import { AdminService } from '../services/admin.service';

@ApiTags('Admin - Analytics')
@UseGuards(AdminGuard)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get analytics statistics for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Analytics statistics retrieved successfully',
    type: AnalyticsStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalyticsStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getAnalyticsStats({ startDate, endDate });
  }

  @Get('ctr-trend')
  @ApiOperation({ summary: 'Get CTR trend data for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'CTR trend data retrieved successfully',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCTRTrend(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getCTRTrend({ startDate, endDate });
  }

  @Get('most-searched-terms')
  @ApiOperation({ summary: 'Get most searched terms for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Most searched terms retrieved successfully',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMostSearchedTerms(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getMostSearchedTerms({ startDate, endDate });
  }

  @Get('clicks-per-category')
  @ApiOperation({ summary: 'Get clicks per category for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Clicks per category data retrieved successfully',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getClicksPerCategory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('parentCategoryId') parentCategoryId?: string,
  ): Promise<{ categoryId: string; categoryName: string; clicks: number }[]> {
    return this.adminService.getClicksPerCategory(
      { startDate, endDate },
      parentCategoryId,
    );
  }

  @Get('views-trend')
  @ApiOperation({ summary: 'Get views trend data for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Views trend data retrieved successfully',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getViewsTrend(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getViewsTrend({ startDate, endDate });
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance data for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Product performance data retrieved successfully',
    type: ProductPerformanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProductPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const { data, total } = await this.adminService.getProductPerformance(
      { startDate, endDate },
      undefined,
      pageNum,
      limitNum,
    );
    return {
      data,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
