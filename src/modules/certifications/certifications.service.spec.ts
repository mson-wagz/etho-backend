/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CertificationService } from './certification.service';
import { CertificationRepository } from '../../repository/certification.repository';
import { Certification } from '../../entities/certification.entity';

describe('CertificationService', () => {
  let service: CertificationService;
  let certificationRepository: CertificationRepository;

  const mockCertification: Certification = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Organic Certified',
    description: 'USDA certified organic product',
    slug: 'organic-certified',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    filter_id: '',
    certifying_body: '',
    filter: {} as any,
    product_certifications: [],
  };

  const mockCertifications: Certification[] = [
    mockCertification,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Fair Trade Certified',
      description: 'Fair Trade USA certified',
      slug: 'fair-trade-certified',
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
      filter_id: '',
      certifying_body: '',
      filter: {} as any,
      product_certifications: [],
    },
  ];

  const mockCertificationRepository = {
    find: jest.fn(),
    findBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        {
          provide: CertificationRepository,
          useValue: mockCertificationRepository,
        },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
    certificationRepository = module.get<CertificationRepository>(
      CertificationRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCertifications', () => {
    it('should return all certifications', async () => {
      mockCertificationRepository.find.mockResolvedValue(mockCertifications);

      const result = await service.getCertifications();

      expect(certificationRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockCertification.id,
        name: mockCertification.name,
        description: mockCertification.description,
        slug: mockCertification.slug,
        certifying_body: mockCertification.certifying_body,
        createdAt: mockCertification.created_at,
        updatedAt: mockCertification.updated_at,
      });
    });

    it('should return empty array when no certifications found', async () => {
      mockCertificationRepository.find.mockResolvedValue([]);

      const result = await service.getCertifications();

      expect(certificationRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(0);
    });

    it('should throw error when repository fails', async () => {
      const errorMessage = 'Database connection error';
      mockCertificationRepository.find.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.getCertifications()).rejects.toThrow(
        `Failed to fetch certifications: ${errorMessage}`,
      );
    });
  });

  describe('getCertificationBySlug', () => {
    it('should return certification when found', async () => {
      mockCertificationRepository.findBySlug.mockResolvedValue(
        mockCertification,
      );

      const result = await service.getCertificationBySlug('organic-certified');

      expect(certificationRepository.findBySlug).toHaveBeenCalledWith(
        'organic-certified',
      );
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.slug).toBe('organic-certified');
      expect(result!.name).toBe('Organic Certified');
    });

    it('should return null when certification not found', async () => {
      mockCertificationRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getCertificationBySlug('non-existent');

      expect(certificationRepository.findBySlug).toHaveBeenCalledWith(
        'non-existent',
      );
      expect(result).toBeNull();
    });

    it('should handle certification with null count', async () => {
      const certificationWithNullCount = {
        ...mockCertification,
      };
      mockCertificationRepository.findBySlug.mockResolvedValue(
        certificationWithNullCount,
      );

      const result = await service.getCertificationBySlug('organic-certified');

      expect(result).not.toBeNull();
    });

    it('should handle certification with null active', async () => {
      const certificationWithNullActive = {
        ...mockCertification,
      };
      mockCertificationRepository.findBySlug.mockResolvedValue(
        certificationWithNullActive,
      );

      const result = await service.getCertificationBySlug('organic-certified');

      expect(result).not.toBeNull();
    });

    it('should throw error when repository fails', async () => {
      const errorMessage = 'Database connection error';
      mockCertificationRepository.findBySlug.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        service.getCertificationBySlug('organic-certified'),
      ).rejects.toThrow(`Failed to fetch certification: ${errorMessage}`);
    });
  });
});
