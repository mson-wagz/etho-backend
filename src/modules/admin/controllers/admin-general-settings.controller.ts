import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { AdminService } from '../services/admin.service';
import { GeneralSettingsResponseDto } from '../dto/general-settings-response.dto';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';

@ApiTags('Admin - General Settings')
@Controller('admin/general-settings')
@UseGuards(AdminGuard)
export class AdminGeneralSettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get general settings' })
  @ApiResponse({
    status: 200,
    description: 'General settings retrieved successfully',
    type: GeneralSettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'General settings not found' })
  async getGeneralSettings(): Promise<GeneralSettingsResponseDto> {
    return await this.adminService.getGeneralSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update general settings' })
  @ApiBody({ type: UpdateGeneralSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'General settings updated successfully',
    type: GeneralSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'General settings not found' })
  async updateGeneralSettings(
    @Body() updateDto: UpdateGeneralSettingsDto,
  ): Promise<GeneralSettingsResponseDto> {
    return await this.adminService.updateGeneralSettings(updateDto);
  }
}
