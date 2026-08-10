import { Injectable } from '@nestjs/common';
import { CertificationRepository } from '../../repository/certification.repository';
import { CertificationResponse } from './dto/certificate-response.dto';

@Injectable()
export class CertificationService {
  constructor(
    private readonly certificationRepository: CertificationRepository,
  ) {}

  async getCertifications(): Promise<CertificationResponse[]> {
    try {
      const certifications = await this.certificationRepository.find();

      const certificationResponses: CertificationResponse[] =
        certifications.map((certification) => ({
          id: certification.id,
          name: certification.name,
          slug: certification.slug,
          certifying_body: certification.certifying_body,
          description: certification.description,
          createdAt: certification.created_at,
          updatedAt: certification.updated_at,
        }));

      return certificationResponses;
    } catch (error) {
      console.error('Service error:', error);
      throw new Error(`Failed to fetch certifications: ${error.message}`);
    }
  }

  async getCertificationBySlug(
    slug: string,
  ): Promise<CertificationResponse | null> {
    try {
      const certification = await this.certificationRepository.findBySlug(slug);
      if (!certification) return null;

      return {
        id: certification.id,
        name: certification.name,
        slug: certification.slug,
        certifying_body: certification.certifying_body,
        description: certification.description,
        createdAt: certification.created_at,
        updatedAt: certification.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to fetch certification: ${error.message}`);
    }
  }
}
