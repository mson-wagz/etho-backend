import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MiscellaneousController } from './miscellaneous.controller';
import { MiscellaneousService } from './miscellaneous.service';

describe('MiscellaneousController', () => {
  let controller: MiscellaneousController;
  let service: MiscellaneousService;

  const mockMiscellaneousService = {
    convertCurrency: jest.fn(),
    updateExchangeRates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiscellaneousController],
      providers: [
        { provide: MiscellaneousService, useValue: mockMiscellaneousService },
      ],
    }).compile();

    controller = module.get<MiscellaneousController>(MiscellaneousController);
    service = module.get<MiscellaneousService>(MiscellaneousService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('should convert currency successfully', async () => {
      mockMiscellaneousService.convertCurrency.mockResolvedValue(85.5);

      const result = await controller.convertCurrency('USD', 'EUR', {
        amount: 100,
      });

      expect(result).toEqual({
        success: true,
        data: { amount: 100, from: 'USD', to: 'EUR', convertedAmount: 85.5 },
      });
    });

    it('should handle service error', async () => {
      mockMiscellaneousService.convertCurrency.mockRejectedValue(
        new Error('Exchange rates not available'),
      );

      await expect(
        controller.convertCurrency('USD', 'EUR', { amount: 100 }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateExchangeRates', () => {
    it('should update exchange rates successfully', async () => {
      mockMiscellaneousService.updateExchangeRates.mockResolvedValue(
        undefined,
      );

      const result = await controller.updateExchangeRates();

      expect(result).toEqual({
        success: true,
        message: 'Exchange rates updated successfully',
      });
    });

    it('should handle service error', async () => {
      mockMiscellaneousService.updateExchangeRates.mockRejectedValue(
        new Error('Failed to fetch'),
      );

      await expect(controller.updateExchangeRates()).rejects.toThrow(
        HttpException,
      );
    });
  });
});
