import { Test, TestingModule } from '@nestjs/testing';
import { AdminKeywordsController } from './admin-keywords.controller';
import { AdminService } from '../services/admin.service';
import { AdminKeywordResponseDto } from '../dto/admin-keyword-response.dto';
import { CreateKeywordDto } from '../dto/create-keyword.dto';
import { UpdateKeywordDto } from '../dto/update-keyword.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AdminKeywordsController', () => {
  let controller: AdminKeywordsController;

  const mockKeyword: AdminKeywordResponseDto = {
    id: 'keyword-123',
    keyword: 'organic',
    filter_id: 'filter-123',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockAdminService = {
    createKeyword: jest.fn(),
    updateKeyword: jest.fn(),
    deleteKeyword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminKeywordsController],
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

    controller = module.get<AdminKeywordsController>(AdminKeywordsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createKeyword', () => {
    const createDto: CreateKeywordDto = {
      keyword: 'organic',
      filter_id: 'filter-123',
    };

    it('should create a keyword successfully', async () => {
      mockAdminService.createKeyword.mockResolvedValue(mockKeyword);

      const result = await controller.createKeyword(createDto);

      expect(mockAdminService.createKeyword).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockKeyword);
    });

    it('should handle filter not found error', async () => {
      mockAdminService.createKeyword.mockRejectedValue(
        new NotFoundException('Filter/Category not found'),
      );

      await expect(controller.createKeyword(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle duplicate keyword conflict', async () => {
      mockAdminService.createKeyword.mockRejectedValue(
        new ConflictException(
          'Duplicate keyword already exists for this filter',
        ),
      );

      await expect(controller.createKeyword(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateKeyword', () => {
    const updateDto: UpdateKeywordDto = {
      keyword: 'sustainable',
    };

    it('should update a keyword successfully', async () => {
      const updatedKeyword = { ...mockKeyword, keyword: 'sustainable' };
      mockAdminService.updateKeyword.mockResolvedValue(updatedKeyword);

      const result = await controller.updateKeyword('keyword-123', updateDto);

      expect(mockAdminService.updateKeyword).toHaveBeenCalledWith(
        'keyword-123',
        updateDto,
      );
      expect(result).toEqual(updatedKeyword);
    });

    it('should handle not found error', async () => {
      mockAdminService.updateKeyword.mockRejectedValue(
        new NotFoundException('Keyword not found'),
      );

      await expect(
        controller.updateKeyword('invalid-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate keyword conflict', async () => {
      mockAdminService.updateKeyword.mockRejectedValue(
        new ConflictException(
          'Duplicate keyword already exists for this filter',
        ),
      );

      await expect(
        controller.updateKeyword('keyword-123', updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteKeyword', () => {
    it('should delete a keyword successfully', async () => {
      mockAdminService.deleteKeyword.mockResolvedValue(undefined);

      await controller.deleteKeyword('keyword-123');

      expect(mockAdminService.deleteKeyword).toHaveBeenCalledWith(
        'keyword-123',
      );
    });

    it('should handle not found error', async () => {
      mockAdminService.deleteKeyword.mockRejectedValue(
        new NotFoundException('Keyword not found'),
      );

      await expect(controller.deleteKeyword('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
