/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AnalyticsEventService } from './analytics-event.service';
import { AnalyticsEventRepository } from '../../repository/analytics-event.repository';
import { ProductRepository } from '../../repository/product.repository';
import { CategoryRepository } from '../../repository/category.repository';
import { SearchQueryRepository } from '../../repository/search-query.repository';
import { IngestionRunRepository } from '../../repository/ingestion-run.repository';
import { AnalyticsEvent } from '../../entities/analytics-event.entity';
import { CreateAnalyticsEvent } from './dto/analytics-event.dto';

describe('AnalyticsEventService', () => {
  let service: AnalyticsEventService;
  let repository: AnalyticsEventRepository;
  let productRepository: ProductRepository;
  let mockQueryRunner: any;

  const mockRepository = {
    findByProductId: jest.fn(),
    findByEventType: jest.fn(),
    create: jest.fn((data) => data),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
      },
    };

    mockDataSource.createQueryRunner = jest
      .fn()
      .mockReturnValue(mockQueryRunner);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsEventService,
        {
          provide: AnalyticsEventRepository,
          useValue: mockRepository,
        },
        {
          provide: IngestionRunRepository,
          useValue: {},
        },
        {
          provide: ProductRepository,
          useValue: mockProductRepository,
        },
        {
          provide: CategoryRepository,
          useValue: {},
        },
        {
          provide: SearchQueryRepository,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AnalyticsEventService>(AnalyticsEventService);
    repository = module.get<AnalyticsEventRepository>(AnalyticsEventRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createAnalyticsEvent', () => {
    const validEventData: CreateAnalyticsEvent = {
      event_type: 'page_view',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      metadata: {
        page_url: '/products/item-1',
        referrer: 'https://google.com',
      },
    };

    const mockProduct = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Product',
    };

    const mockEventType = {
      id: '1',
      event_type: 'page_view',
    };

    const mockSession = {
      id: 'session-id-1',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      event_type: 'session_start',
      product_id: null,
      metadata: {},
      created_at: new Date('2024-01-01T00:00:00Z'),
      product: null,
    } as unknown as AnalyticsEvent;

    const mockAnalyticsEvent = {
      id: 'event-id-1',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      event_type: 'page_view',
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      metadata: { page_url: '/products/item-1' },
      created_at: new Date('2024-01-01T00:00:01Z'),
      product: null,
    } as unknown as AnalyticsEvent;

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('successful event creation', () => {
      it('should create a new analytics event with existing session', async () => {
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockResolvedValue(mockAnalyticsEvent);

        const result = await service.createAnalyticsEvent(validEventData);

        expect(mockQueryRunner.connect).toHaveBeenCalled();
        expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
        expect(repository.findByProductId).toHaveBeenCalledWith(
          validEventData.product_id,
        );
        expect(repository.findByEventType).toHaveBeenCalledWith(
          validEventData.event_type,
        );
        expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(
          AnalyticsEvent,
          {
            where: { session_id: validEventData.session_id },
          },
        );
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
        expect(result).toEqual({
          event: mockAnalyticsEvent,
          session: mockSession,
        });
      });

      it('should create both session and event when session does not exist', async () => {
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(null);
        mockQueryRunner.manager.save.mockResolvedValue(mockAnalyticsEvent);

        const result = await service.createAnalyticsEvent(validEventData);

        expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(1);
        expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
          AnalyticsEvent,
          {
            session_id: validEventData.session_id,
            event_type: validEventData.event_type,
            product_id: validEventData.product_id,
            metadata: validEventData.metadata,
          },
        );
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(result).toEqual({
          event: mockAnalyticsEvent,
          session: mockAnalyticsEvent, // Same event serves as session
        });
      });

      it('should create event without product_id when not provided', async () => {
        const eventDataWithoutProduct = {
          event_type: 'page_view',
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          metadata: { page: 'home' },
        };

        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockResolvedValue(mockAnalyticsEvent);

        const result = await service.createAnalyticsEvent(
          eventDataWithoutProduct,
        );

        expect(repository.findByProductId).not.toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(result).toEqual({
          event: mockAnalyticsEvent,
          session: mockSession,
        });
      });

      it('should handle event without metadata', async () => {
        const eventDataWithoutMetadata = {
          event_type: 'page_view',
          session_id: '550e8400-e29b-41d4-a716-446655440000',
        };

        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(null);
        mockQueryRunner.manager.save.mockResolvedValue(mockSession);

        const result = await service.createAnalyticsEvent(
          eventDataWithoutMetadata,
        );

        expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
          AnalyticsEvent,
          {
            session_id: eventDataWithoutMetadata.session_id,
            event_type: eventDataWithoutMetadata.event_type,
            product_id: undefined,
            metadata: {},
          },
        );
        expect(result).toBeDefined();
      });
    });

    describe('validation errors', () => {
      it('should throw NotFoundException when product does not exist', async () => {
        mockProductRepository.findOne.mockResolvedValue(null);

        await expect(
          service.createAnalyticsEvent(validEventData),
        ).rejects.toThrow(new NotFoundException('Product not found'));

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when event type does not exist', async () => {
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockRepository.findByEventType.mockResolvedValue(null);

        await expect(
          service.createAnalyticsEvent(validEventData),
        ).rejects.toThrow(new NotFoundException('Event type not found'));

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      });

      it('should not validate product when product_id is not provided', async () => {
        const eventDataWithoutProduct = {
          event_type: 'page_view',
          session_id: '550e8400-e29b-41d4-a716-446655440000',
        };

        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockResolvedValue(mockAnalyticsEvent);

        await service.createAnalyticsEvent(eventDataWithoutProduct);

        expect(repository.findByProductId).not.toHaveBeenCalled();
      });
    });

    describe('transaction handling', () => {
      it('should rollback transaction on database error', async () => {
        const dbError = new Error('Database connection failed');
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockRejectedValue(dbError);

        await expect(
          service.createAnalyticsEvent(validEventData),
        ).rejects.toThrow(dbError);

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      });

      it('should rollback transaction on save error', async () => {
        const saveError = new Error('Failed to save entity');
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockRejectedValue(saveError);

        await expect(
          service.createAnalyticsEvent(validEventData),
        ).rejects.toThrow(saveError);

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      });

      it('should always release query runner even on error', async () => {
        const error = new Error('Some error');
        mockProductRepository.findOne.mockRejectedValue(error);

        await expect(
          service.createAnalyticsEvent(validEventData),
        ).rejects.toThrow(error);

        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should call transaction methods in correct order on success', async () => {
        mockProductRepository.findOne.mockResolvedValue(mockProduct);
        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockResolvedValue(mockAnalyticsEvent);

        await service.createAnalyticsEvent(validEventData);

        const calls = [
          mockQueryRunner.connect,
          mockQueryRunner.startTransaction,
          mockQueryRunner.commitTransaction,
          mockQueryRunner.release,
        ];

        for (let i = 0; i < calls.length - 1; i++) {
          expect(calls[i].mock.invocationCallOrder[0]).toBeLessThan(
            calls[i + 1].mock.invocationCallOrder[0],
          );
        }
      });
    });

    describe('edge cases', () => {
      it('should handle empty metadata object', async () => {
        const eventDataEmptyMetadata = {
          event_type: 'page_view',
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          metadata: {},
        };

        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockResolvedValue(mockAnalyticsEvent);

        const result = await service.createAnalyticsEvent(
          eventDataEmptyMetadata,
        );

        expect(result).toBeDefined();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      });

      it('should handle complex metadata structures', async () => {
        const eventDataComplexMetadata = {
          event_type: 'page_view',
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          metadata: {
            user: { id: '123', name: 'John' },
            location: { country: 'US', city: 'NYC' },
            tags: ['tag1', 'tag2'],
          },
        };

        mockRepository.findByEventType.mockResolvedValue(mockEventType);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockSession);
        mockQueryRunner.manager.save.mockResolvedValue({
          ...mockAnalyticsEvent,
          metadata: eventDataComplexMetadata.metadata,
        });

        const result = await service.createAnalyticsEvent(
          eventDataComplexMetadata,
        );

        expect(result.event).toBeDefined();
        expect(result.event.id).toBe(mockAnalyticsEvent.id);
      });
    });
  });
});
