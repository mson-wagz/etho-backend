import { Test, TestingModule } from '@nestjs/testing';
import { AdminCertificationsController } from './admin-certifications.controller';
import { AdminService } from '../services/admin.service';
import { AdminCertificationResponseDto } from '../dto/admin-certification-response.dto';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AdminCertificationsController', () => {
  let controller: AdminCertificationsController;

  const mockCertification: AdminCertificationResponseDto = {
    id: 'cert-123',
    name: 'GOTS',
    slug: 'gots',
    filter_id: 'filter-123',
    certifying_body: 'Global Organic Textile Standard',
    description: 'Organic textile certification',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockAdminService = {
    getCertifications: jest.fn(),
    createCertification: jest.fn(),
    updateCertification: jest.fn(),
    deleteCertification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCertificationsController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: AdminRoleGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: AdminGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get<AdminCertificationsController>(
      AdminCertificationsController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCertifications', () => {
    it('should return certifications with optional search', async () => {
      mockAdminService.getCertifications.mockResolvedValue([mockCertification]);

      const result = await controller.getCertifications('gots');

      expect(mockAdminService.getCertifications).toHaveBeenCalledWith('gots');
      expect(result).toEqual([mockCertification]);
    });
  });

  describe('createCertification', () => {
    const createDto: CreateCertificationDto = {
      name: 'GOTS',
      filter_id: 'filter-123',
      certifying_body: 'Global Organic Textile Standard',
      description: 'Organic textile certification',
    };

    it('should create a certification successfully', async () => {
      mockAdminService.createCertification.mockResolvedValue(mockCertification);

      const result = await controller.createCertification(createDto);

      expect(mockAdminService.createCertification).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(mockCertification);
    });

    it('should handle filter not found error', async () => {
      mockAdminService.createCertification.mockRejectedValue(
        new NotFoundException('Filter/Category not found'),
      );

      await expect(controller.createCertification(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle conflict when certification name exists', async () => {
      mockAdminService.createCertification.mockRejectedValue(
        new ConflictException('Certification with this name already exists'),
      );

      await expect(controller.createCertification(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateCertification', () => {
    const updateDto: UpdateCertificationDto = {
      name: 'Updated GOTS',
    };

    it('should update a certification successfully', async () => {
      const updatedCertification = { ...mockCertification, ...updateDto };
      mockAdminService.updateCertification.mockResolvedValue(
        updatedCertification,
      );

      const result = await controller.updateCertification(
        'cert-123',
        updateDto,
      );

      expect(mockAdminService.updateCertification).toHaveBeenCalledWith(
        'cert-123',
        updateDto,
      );
      expect(result).toEqual(updatedCertification);
    });

    it('should handle not found error', async () => {
      mockAdminService.updateCertification.mockRejectedValue(
        new NotFoundException('Certification not found'),
      );

      await expect(
        controller.updateCertification('invalid-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle conflict when name already exists', async () => {
      mockAdminService.updateCertification.mockRejectedValue(
        new ConflictException('Certification with this name already exists'),
      );

      await expect(
        controller.updateCertification('cert-123', updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteCertification', () => {
    it('should delete a certification successfully', async () => {
      mockAdminService.deleteCertification.mockResolvedValue(undefined);

      await controller.deleteCertification('cert-123');

      expect(mockAdminService.deleteCertification).toHaveBeenCalledWith(
        'cert-123',
      );
    });

    it('should handle not found error', async () => {
      mockAdminService.deleteCertification.mockRejectedValue(
        new NotFoundException('Certification not found'),
      );

      await expect(
        controller.deleteCertification('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
