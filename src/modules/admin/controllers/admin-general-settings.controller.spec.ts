import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminGeneralSettingsController } from './admin-general-settings.controller';
import { AdminService } from '../services/admin.service';
import { GeneralSettingsResponseDto } from '../dto/general-settings-response.dto';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';
import { PeriodUnit } from '../../../entities/general-settings.entity';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';

describe('AdminGeneralSettingsController', () => {
  let controller: AdminGeneralSettingsController;
  let service: AdminService;

  const mockGeneralSettingsResponse: GeneralSettingsResponseDto = {
    scraping_frequency: 1,
    scraping_frequency_period_value: 3,
    scraping_frequency_period_unit: PeriodUnit.DAYS,
  };

  const mockAdminService = {
    getGeneralSettings: jest.fn(),
    updateGeneralSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGeneralSettingsController],
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

    controller = module.get<AdminGeneralSettingsController>(
      AdminGeneralSettingsController,
    );
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGeneralSettings', () => {
    it('should return general settings successfully', async () => {
      mockAdminService.getGeneralSettings.mockResolvedValue(
        mockGeneralSettingsResponse,
      );

      const result = await controller.getGeneralSettings();

      expect(mockAdminService.getGeneralSettings).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGeneralSettingsResponse);
    });

    it('should throw NotFoundException when settings not found', async () => {
      mockAdminService.getGeneralSettings.mockRejectedValue(
        new NotFoundException('General settings not found'),
      );

      await expect(controller.getGeneralSettings()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGeneralSettings', () => {
    const updateDto: UpdateGeneralSettingsDto = {
      scraping_frequency: 2,
      scraping_frequency_period_value: 5,
      scraping_frequency_period_unit: PeriodUnit.WEEKS,
    };

    it('should update general settings successfully', async () => {
      const updatedResponse = { ...mockGeneralSettingsResponse, ...updateDto };
      mockAdminService.updateGeneralSettings.mockResolvedValue(updatedResponse);

      const result = await controller.updateGeneralSettings(updateDto);

      expect(mockAdminService.updateGeneralSettings).toHaveBeenCalledWith(
        updateDto,
      );
      expect(result).toEqual(updatedResponse);
    });

    it('should throw NotFoundException when update fails', async () => {
      mockAdminService.updateGeneralSettings.mockRejectedValue(
        new NotFoundException('Failed to update general settings'),
      );

      await expect(controller.updateGeneralSettings(updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
