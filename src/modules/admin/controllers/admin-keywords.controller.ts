import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { AdminKeywordResponseDto } from '../dto/admin-keyword-response.dto';
import { CreateKeywordDto } from '../dto/create-keyword.dto';
import { UpdateKeywordDto } from '../dto/update-keyword.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Admin - Keywords')
@Controller('admin/filters/keywords')
@UseGuards(AdminGuard)
export class AdminKeywordsController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new keyword' })
  @ApiBody({ type: CreateKeywordDto })
  @ApiResponse({
    status: 201,
    description: 'Keyword created successfully',
    type: AdminKeywordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Filter/Category not found' })
  @ApiResponse({ status: 409, description: 'Duplicate keyword already exists' })
  async createKeyword(
    @Body() createKeywordDto: CreateKeywordDto,
  ): Promise<AdminKeywordResponseDto> {
    return await this.adminService.createKeyword(createKeywordDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing keyword' })
  @ApiParam({ name: 'id', description: 'Keyword ID' })
  @ApiBody({ type: UpdateKeywordDto })
  @ApiResponse({
    status: 200,
    description: 'Keyword updated successfully',
    type: AdminKeywordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid UUID or input data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Keyword or Filter/Category not found',
  })
  @ApiResponse({ status: 409, description: 'Duplicate keyword already exists' })
  async updateKeyword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateKeywordDto: UpdateKeywordDto,
  ): Promise<AdminKeywordResponseDto> {
    return await this.adminService.updateKeyword(id, updateKeywordDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a keyword' })
  @ApiParam({ name: 'id', description: 'Keyword ID' })
  @ApiResponse({ status: 204, description: 'Keyword deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Keyword not found' })
  async deleteKeyword(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.adminService.deleteKeyword(id);
  }
}
