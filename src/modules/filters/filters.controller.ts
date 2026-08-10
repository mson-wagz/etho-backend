import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { FilterService } from './filters.service';
import { FiltersResponseDto } from './dto/filters-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('filters')
@Controller('filters')
export class FiltersController {
  constructor(private readonly filterService: FilterService) {}

  @Get()
  @ApiOperation({ summary: 'Get all filters' })
  @ApiResponse({
    status: 200,
    description: 'List of filters returned successfully',
    type: [FiltersResponseDto],
  })
  async getFilters(): Promise<FiltersResponseDto[]> {
    return await this.filterService.getFilters();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get filter by slug' })
  @ApiParam({ name: 'slug', description: 'Filter slug', example: 'organic' })
  @ApiResponse({
    status: 200,
    description: 'Filter returned successfully',
    type: FiltersResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Filter not found' })
  async getFilterBySlug(
    @Param('slug') slug: string,
  ): Promise<FiltersResponseDto> {
    const filter = await this.filterService.getFilterBySlug(slug);
    if (!filter) {
      throw new NotFoundException('Filter not found');
    }
    return filter;
  }
}
