import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CertificationService } from './certification.service';
import { CertificationResponseDto } from './dto/certificate-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('certifications')
@Controller('certifications')
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all certifications' })
  @ApiResponse({
    status: 200,
    description: 'List of certifications returned successfully',
    type: [CertificationResponseDto],
  })
  async getCertifications(): Promise<CertificationResponseDto[]> {
    return await this.certificationService.getCertifications();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get certification by slug' })
  @ApiParam({
    name: 'slug',
    description: 'Certification slug',
    example: 'gots',
  })
  @ApiResponse({
    status: 200,
    description: 'Certification returned successfully',
    type: CertificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Certification not found' })
  async getCertificationBySlug(
    @Param('slug') slug: string,
  ): Promise<CertificationResponseDto> {
    const certification =
      await this.certificationService.getCertificationBySlug(slug);
    if (!certification) {
      throw new NotFoundException('Certification not found');
    }
    return certification;
  }
}
