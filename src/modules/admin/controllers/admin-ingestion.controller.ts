import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Query,
  UseGuards,
  Param,
  Res,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { BrandsIngestionQueryDto } from '../../ingestion/dto/brands-ingestion-query.dto';
import { BrandsIngestionResponseDto } from '../../ingestion/dto/brands-ingestion-response.dto';
import { IngestionStatsResponseDto } from '../dto/ingestion-stats.dto';
import { BrandIngestionDownloadQueryDto } from '../dto/brand-ingestion-download.dto';
import { RerunIngestionDto } from '../dto/rerun-ingestion.dto';
import { RerunIngestionResponseDto } from '../dto/rerun-ingestion-response.dto';
import { BrandRunHistoryResponseDto } from '../../ingestion/dto/brand-run-history-response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { Response } from 'express';
import {
  ConfigureSourceDto,
  SaveConfiguredSourceDto,
  SaveRegeneratedConfigDto,
} from '../dto/add-source.dto';
import { DeleteBrandDto } from '../dto/delete-brand.dto';
import { EditSourceDto, BrandConfigResponseDto } from '../dto/edit-source.dto';
import { SourceHistoryItemDto } from '../dto/source-history.dto';

@ApiTags('Admin - Ingestion')
@Controller('admin/ingestion')
@UseGuards(AdminGuard)
export class AdminIngestionController {
  constructor(private readonly adminService: AdminService) {}

  @Get('brands/history')
  @ApiOperation({
    summary: 'Get history of all source configurations including deleted ones',
  })
  @ApiResponse({
    status: 200,
    description: 'Source history returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSourceHistory(): Promise<SourceHistoryItemDto[]> {
    return this.adminService.getSourceHistory();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get paginated brands ingestion logs' })
  @ApiResponse({
    status: 200,
    description: 'Brands ingestion logs returned successfully',
    type: BrandsIngestionResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getBrandsIngestionLogs(
    @Query() query: BrandsIngestionQueryDto,
  ): Promise<BrandsIngestionResponseDto> {
    return await this.adminService.getBrandsIngestionLogs(query);
  }

  @Post('brands/configure-new-source')
  @ApiOperation({ summary: 'Configure a new source by providing its URL' })
  @ApiBody({
    type: ConfigureSourceDto,
    description: 'Data required to configure a new source',
  })
  @ApiResponse({
    status: 201,
    description: 'Source configuration initiated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid URL provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async configureNewSource(
    @Body() configureSourceDto: ConfigureSourceDto,
  ): Promise<{ message: string; jobId: string }> {
    const { jobId } =
      await this.adminService.configureBrandForAddition(configureSourceDto);
    return {
      message: 'Source configuration initiated successfully',
      jobId,
    };
  }

  @Get('brands/configuration-status/:jobId')
  @ApiOperation({ summary: 'Get the status of a source configuration job' })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID returned when initiating source configuration',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Source configuration status returned successfully',
    schema: {
      example: {
        jobId: 'configure-example.com',
        siteUrl: 'https://example.com',
        status: 'pending | in_progress | completed | failed',
        progress: 0, // percentage
        result: {
          success: true,
          message: 'Configuration completed successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSourceConfigurationStatus(
    @Param('jobId') jobId: string,
  ): Promise<any> {
    return await this.adminService.getBrandAdditionStatus(jobId);
  }

  @Post('brands/save-configured-source')
  @ApiOperation({
    summary:
      'Finish source configuration by providing the generated site config',
  })
  @ApiBody({
    type: SaveConfiguredSourceDto,
    description: 'Data required to save the configured source',
  })
  @ApiResponse({
    status: 200,
    description: 'Source configuration saved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand or job not found' })
  async finishSourceConfiguration(
    @Body() saveConfigDto: SaveConfiguredSourceDto,
  ): Promise<{ message: string }> {
    await this.adminService.saveConfiguredBrand(saveConfigDto);
    return { message: 'Source configuration saved successfully' };
  }

  @Post('brand/:id/save-regenerated-config')
  @ApiOperation({
    summary:
      'Save a regenerated site config, overwriting the existing scraping source config for the brand',
  })
  @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
  @ApiBody({
    type: SaveRegeneratedConfigDto,
    description: 'The regenerated site config to save',
  })
  @ApiResponse({
    status: 200,
    description: 'Regenerated config saved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Brand or scraping source not found',
  })
  async saveRegeneratedConfig(
    @Param('id', ParseUUIDPipe) brandId: string,
    @Body() dto: SaveRegeneratedConfigDto,
  ): Promise<{ message: string }> {
    return await this.adminService.saveRegeneratedConfig(brandId, dto.config);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ingestion dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion statistics returned successfully',
    type: IngestionStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getIngestionStats(): Promise<IngestionStatsResponseDto> {
    return await this.adminService.getIngestionStats();
  }

  @Get('brand/:id/download')
  @ApiOperation({ summary: 'Download brand ingestion log as JSON or CSV' })
  @ApiParam({ name: 'id', description: 'Brand ID', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Brand ingestion log downloaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async downloadBrandIngestionLog(
    @Param('id') brandId: string,
    @Query() query: BrandIngestionDownloadQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    return await this.adminService.downloadBrandIngestionLog(
      brandId,
      query.format,
      response,
    );
  }

  @Post('brand/:id/rerun')
  @ApiOperation({ summary: 'Re-run ingestion for a specific brand' })
  @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
  @ApiBody({ type: RerunIngestionDto })
  @ApiResponse({
    status: 201,
    description: 'Ingestion re-run initiated successfully',
    type: RerunIngestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid UUID or input data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded - max 1 rerun per hour',
  })
  @ApiResponse({ status: 400, description: 'Brand is not active' })
  async rerunBrandIngestion(
    @Param('id', ParseUUIDPipe) brandId: string,
    @Body() rerunDto: RerunIngestionDto,
  ): Promise<RerunIngestionResponseDto> {
    return await this.adminService.rerunBrandIngestion(brandId, rerunDto);
  }

  @Delete('jobs/:ingestionRunId')
  @ApiOperation({ summary: 'Abort an active crawl job' })
  @ApiParam({
    name: 'ingestionRunId',
    description: 'Ingestion run ID',
    type: 'string',
  })
  @ApiResponse({ status: 200, description: 'Abort signal sent to scraper' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async abortCrawlJob(
    @Param('ingestionRunId') ingestionRunId: string,
  ): Promise<{ aborted: boolean }> {
    return await this.adminService.abortCrawlJob(ingestionRunId);
  }

  @Post('brand/delete')
  @ApiOperation({ summary: 'Delete a brand and/or its products' })
  @ApiBody({ type: DeleteBrandDto })
  @ApiResponse({
    status: 200,
    description: 'Brand deletion completed successfully',
    schema: {
      example: {
        message: 'Brand and associated products deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async deleteBrand(
    @Body() deleteBrandDto: DeleteBrandDto,
  ): Promise<{ message: string }> {
    return await this.adminService.deleteBrand(deleteBrandDto);
  }

  @Get('brand/:id/history')
  @ApiOperation({ summary: 'Get run history for a specific brand' })
  @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Brand run history returned successfully',
    type: BrandRunHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async getBrandRunHistory(
    @Param('id', ParseUUIDPipe) brandId: string,
  ): Promise<BrandRunHistoryResponseDto> {
    return await this.adminService.getBrandRunHistory(brandId);
  }

  @Get('brand/:id/config')
  @ApiOperation({ summary: 'Get editable configuration for a specific brand' })
  @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Brand configuration returned successfully',
    type: BrandConfigResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async getBrandConfig(
    @Param('id', ParseUUIDPipe) brandId: string,
  ): Promise<BrandConfigResponseDto> {
    return await this.adminService.getBrandConfig(brandId);
  }

  @Patch('brand/:id')
  @ApiOperation({
    summary: 'Edit brand name, description, and collection URLs',
  })
  @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
  @ApiBody({ type: EditSourceDto })
  @ApiResponse({ status: 200, description: 'Source updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or domain mismatch' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async editSource(
    @Param('id', ParseUUIDPipe) brandId: string,
    @Body() dto: EditSourceDto,
  ): Promise<{ message: string }> {
    return await this.adminService.editSource({ ...dto, brandId });
  }

  @Get('run/:runId/progress')
  @ApiOperation({
    summary: 'Get real-time progress for an active ingestion run',
  })
  @ApiParam({ name: 'runId', description: 'Ingestion run ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Progress data returned, or null if run not found in cache',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getIngestionRunProgress(
    @Param('runId', ParseUUIDPipe) runId: string,
  ): Promise<{
    stage: string;
    collectionTotal: number;
    collectionProcessed: number;
    productsParsed: number;
    productsProcessed: number;
    productsCreated: number;
    productsUpdated: number;
    productsSkipped: number;
    productsErrored: number;
    errors?: Array<{
      message: string;
      retryAfterSeconds: number | null;
      timestamp: string;
    }>;
  } | null> {
    return await this.adminService.getIngestionRunProgress(runId);
  }
}
