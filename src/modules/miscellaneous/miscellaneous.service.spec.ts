import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MiscellaneousService } from './miscellaneous.service';
import { MetaRepository } from '../../repository/meta.repository';
import { MetaKeys } from '../../common/enums/meta.enum';

describe('MiscellaneousService', () => {
  let service: MiscellaneousService;
  let metaRepository: MetaRepository;
  let configService: ConfigService;

  const mockMetaRepository = {
    findByKey: jest.fn(),
    upsertMeta: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiscellaneousService,
        { provide: MetaRepository, useValue: mockMetaRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MiscellaneousService>(MiscellaneousService);
    metaRepository = module.get<MetaRepository>(MetaRepository);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('convertCurrency', () => {
    const mockRates = { USD: 1, EUR: 0.85, GBP: 0.73 };

    it('should convert currency successfully', async () => {
      mockMetaRepository.findByKey.mockResolvedValue({
        value: JSON.stringify(mockRates),
      });

      const result = await service.convertCurrency(100, 'USD', 'EUR');

      expect(result).toBe(85);
    });

    it('should throw error when rates not available', async () => {
      mockMetaRepository.findByKey.mockResolvedValue(null);

      await expect(service.convertCurrency(100, 'USD', 'EUR')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid currency', async () => {
      mockMetaRepository.findByKey.mockResolvedValue({
        value: JSON.stringify(mockRates),
      });

      await expect(
        service.convertCurrency(100, 'INVALID', 'EUR'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateExchangeRates', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should update exchange rates successfully', async () => {
      mockConfigService.get.mockReturnValue('test-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          result: 'success',
          conversion_rates: { USD: 1, EUR: 0.85 },
        }),
      });
      mockMetaRepository.upsertMeta.mockResolvedValue({});

      await service.updateExchangeRates();

      expect(metaRepository.upsertMeta).toHaveBeenCalledWith(
        MetaKeys.CONVERSION_RATE,
        expect.any(String),
      );
    });

    it('should throw error when API fails', async () => {
      mockConfigService.get.mockReturnValue('test-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ result: 'error' }),
      });

      await expect(service.updateExchangeRates()).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
