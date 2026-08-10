import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { AdminFilterSettingsResponseDto } from '../dto/admin-filter-settings.dto';
import { CreateFilterDto } from '../dto/create-filter.dto';
import { UpdateFilterDto } from '../dto/update-filter.dto';
import {
  ApplyFilterSettingsDto,
  ApplyFilterSettingsResponseDto,
} from '../dto/apply-filter-settings.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Filter } from '../../../entities/filter.entity';

@ApiTags('Admin - Filters')
@Controller('admin/filters')
@UseGuards(AdminGuard)
export class AdminFiltersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin filter settings with nested data and counts',
  })
  @ApiQuery({
    name: 'categoryName',
    required: false,
    description: 'Filter by category name (case-insensitive partial match)',
    example: 'Small Business',
  })
  @ApiQuery({
    name: 's',
    required: false,
    description: 'Search by filter name (case-insensitive partial match)',
    example: 'organic',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin filter settings returned successfully',
    type: AdminFilterSettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAdminFilterSettings(
    @Query('categoryName') categoryName?: string,
    @Query('s') searchQuery?: string,
  ): Promise<AdminFilterSettingsResponseDto> {
    return await this.adminService.getFilterSettings(categoryName, searchQuery);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new filter' })
  @ApiBody({ type: CreateFilterDto })
  @ApiResponse({
    status: 201,
    description: 'Filter created successfully',
    type: Filter,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Filter with this name already exists',
  })
  async createFilter(
    @Body() createFilterDto: CreateFilterDto,
  ): Promise<Filter> {
    return await this.adminService.createFilter(createFilterDto);
  }

  @Post('apply-settings')
  @ApiOperation({
    summary: 'Apply all pending filter-settings draft operations atomically',
    description:
      'Executes every operation (create / edit / delete) for filters, keywords, and certifications inside a single database transaction. If any operation fails the entire batch is rolled back.',
  })
  @ApiBody({ type: ApplyFilterSettingsDto })
  @ApiResponse({
    status: 201,
    description: 'All operations applied successfully',
    type: ApplyFilterSettingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — missing fields or unknown operation',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Referenced record not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict — duplicate name or slug',
  })
  async applyFilterSettings(
    @Body() dto: ApplyFilterSettingsDto,
  ): Promise<ApplyFilterSettingsResponseDto> {
    return await this.adminService.applyFilterSettings(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing filter' })
  @ApiParam({ name: 'id', description: 'Filter ID' })
  @ApiBody({ type: UpdateFilterDto })
  @ApiResponse({
    status: 200,
    description: 'Filter updated successfully',
    type: Filter,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid UUID format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Filter not found' })
  @ApiResponse({
    status: 409,
    description: 'Filter with this name already exists',
  })
  async updateFilter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFilterDto: UpdateFilterDto,
  ): Promise<Filter> {
    return await this.adminService.updateFilter(id, updateFilterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a filter and its related keywords' })
  @ApiParam({ name: 'id', description: 'Filter ID' })
  @ApiResponse({ status: 204, description: 'Filter deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid UUID format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Filter not found' })
  async deleteFilter(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.adminService.deleteFilter(id);
  }
}
