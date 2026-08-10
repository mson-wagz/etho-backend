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
import { AdminCertificationResponseDto } from '../dto/admin-certification-response.dto';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Admin - Certifications')
@Controller('admin/filters/certifications')
@UseGuards(AdminGuard)
export class AdminCertificationsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all certifications with optional search' })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search by certification name (case-insensitive partial match)',
    example: 'gots',
  })
  @ApiResponse({
    status: 200,
    description: 'Certifications returned successfully',
    type: [AdminCertificationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCertifications(
    @Query('q') searchQuery?: string,
  ): Promise<AdminCertificationResponseDto[]> {
    return await this.adminService.getCertifications(searchQuery);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new certification' })
  @ApiBody({ type: CreateCertificationDto })
  @ApiResponse({
    status: 201,
    description: 'Certification created successfully',
    type: AdminCertificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Filter/Category not found' })
  @ApiResponse({
    status: 409,
    description: 'Certification with this name already exists',
  })
  async createCertification(
    @Body() createCertificationDto: CreateCertificationDto,
  ): Promise<AdminCertificationResponseDto> {
    return await this.adminService.createCertification(createCertificationDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing certification' })
  @ApiParam({ name: 'id', description: 'Certification ID' })
  @ApiBody({ type: UpdateCertificationDto })
  @ApiResponse({
    status: 200,
    description: 'Certification updated successfully',
    type: AdminCertificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid UUID or input data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Certification or Filter/Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Certification with this name already exists',
  })
  async updateCertification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCertificationDto: UpdateCertificationDto,
  ): Promise<AdminCertificationResponseDto> {
    return await this.adminService.updateCertification(
      id,
      updateCertificationDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a certification' })
  @ApiParam({ name: 'id', description: 'Certification ID' })
  @ApiResponse({
    status: 204,
    description: 'Certification deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Certification not found' })
  async deleteCertification(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.adminService.deleteCertification(id);
  }
}
