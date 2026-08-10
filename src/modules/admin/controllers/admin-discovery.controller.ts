import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AdminGuard } from '../../../common/guards/admin.guard';
import {
  DiscoveryStatsResponseDto,
  DiscoveryResultsQueryDto,
  DiscoveryResultsResponseDto,
  TriggerDiscoveryResponseDto,
  DiscoveryRunStatusResponseDto,
  StopDiscoveryResponseDto,
} from '../dto/admin-discovery.dto';

@ApiTags('Admin - Discovery')
@Controller('admin/discovery')
@UseGuards(AdminGuard)
export class AdminDiscoveryController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get discovery statistics' })
  @ApiResponse({
    status: 200,
    description: 'Discovery stats returned successfully',
    type: DiscoveryStatsResponseDto,
  })
  async getDiscoveryStats(): Promise<DiscoveryStatsResponseDto> {
    return this.adminService.getDiscoveryStats();
  }

  @Get('results')
  @ApiOperation({ summary: 'Get paginated discovery results' })
  @ApiResponse({
    status: 200,
    description: 'Discovery results returned successfully',
    type: DiscoveryResultsResponseDto,
  })
  async getDiscoveryResults(
    @Query() query: DiscoveryResultsQueryDto,
  ): Promise<DiscoveryResultsResponseDto> {
    return this.adminService.getDiscoveryResults(query);
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger a new discovery run' })
  @ApiResponse({
    status: 201,
    description: 'Discovery run triggered successfully',
    type: TriggerDiscoveryResponseDto,
  })
  async triggerDiscovery(
    @Request() req: any,
  ): Promise<TriggerDiscoveryResponseDto> {
    const triggeredBy = req?.user?.email ?? 'admin';
    return this.adminService.triggerDiscoveryRun(triggeredBy);
  }

  @Get('trigger/status')
  @ApiOperation({ summary: 'Get the status of a discovery run' })
  @ApiResponse({
    status: 200,
    description: 'Discovery run status returned successfully',
    type: DiscoveryRunStatusResponseDto,
  })
  async getDiscoveryRunStatus(
    @Query('jobId') jobId: string,
  ): Promise<DiscoveryRunStatusResponseDto> {
    return await this.adminService.getDiscoveryRunStatus(jobId);
  }

  @Post('remove-result')
  @ApiOperation({ summary: 'Remove a discovery result from the list' })
  @ApiResponse({
    status: 200,
    description: 'Discovery result removed successfully',
  })
  async removeDiscoveryResult(
    @Body('id') id: string,
  ): Promise<{ message: string }> {
    await this.adminService.removeDiscoveryResult(id);
    return { message: 'Discovery result removed successfully' };
  }

  @Post('stop')
  @ApiOperation({ summary: 'Stop a running discovery job' })
  @ApiResponse({
    status: 200,
    description: 'Discovery job stopped',
    type: StopDiscoveryResponseDto,
  })
  async stopDiscovery(
    @Body('jobId') jobId: string,
  ): Promise<{ stopped: boolean }> {
    return this.adminService.stopDiscoveryRun(jobId);
  }
}
