import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchStatus, HistoricalTransactionsBatch } from '@prisma/client';
import axios from 'axios';
import { Queue } from 'bullmq';
import { EthPriceService } from '../eth-price/eth-price.service';
import { PrismaService } from '../prisma/prisma.service';
import { GetHistoricalTransactionsByDatesDto } from './dto/get-historical-transactions.dto';
import { HistoricalTransactionsService } from './historical.transactions.service';

// Mock external dependencies
jest.mock('axios');
jest.mock('bullmq');

describe('HistoricalTransactionsService', () => {
  let service: HistoricalTransactionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let ethPriceService: jest.Mocked<EthPriceService>;
  let logger: jest.Mocked<Logger>;
  let transactionsQueue: jest.Mocked<Queue>;

  const mockPrismaService = {
    historicalTransactionsBatch: {
      create: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
    historicalTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEthPriceService = {
    getLatestEthPrice: jest.fn(),
    calculateFeeInUsdt: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalTransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EthPriceService,
          useValue: mockEthPriceService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: 'BullQueue_transactions',
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<HistoricalTransactionsService>(
      HistoricalTransactionsService,
    );
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
    ethPriceService = module.get(EthPriceService);
    logger = module.get(Logger);
    transactionsQueue = module.get('BullQueue_transactions');

    // Setup default mock responses
    mockConfigService.get.mockReturnValue('mock-api-key');
    (axios.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: { result: '12345' } }),
    );
  });

  describe('findHistoricalTransactionsByDates', () => {
    const mockDto: GetHistoricalTransactionsByDatesDto = {
      dateFrom: '2023-01-01',
      dateTo: '2023-01-02',
    };

    const mockBatch: HistoricalTransactionsBatch = {
      id: 1,
      startBlock: 1000,
      endBlock: 2000,
      dateFrom: new Date('2023-01-01').toISOString(),
      dateTo: new Date('2023-01-02').toISOString(),
      status: BatchStatus.PENDING,
      totalTxns: 0,
      totalFeeInEth: 0,
      totalFeeInUsdt: 0,
      updatedAt: new Date(),
    };

    it('should create a batch and queue processing job', async () => {
      mockPrismaService.historicalTransactionsBatch.create.mockResolvedValue(
        mockBatch,
      );

      const result = await service.findHistoricalTransactionsByDates(mockDto);

      expect(result).toEqual(mockBatch);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-historical-transactions',
        expect.objectContaining({
          startBlock: expect.any(Number),
          endBlock: expect.any(Number),
          batchId: mockBatch.id,
          page: 1,
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(
        service.findHistoricalTransactionsByDates(mockDto),
      ).rejects.toThrow('API Error');
    });
  });

  describe('findHistoricalTransactionsBatch', () => {
    const mockBatch: HistoricalTransactionsBatch = {
      id: 1,
      startBlock: 1000,
      endBlock: 2000,
      dateFrom: new Date('2023-01-01').toISOString(),
      dateTo: new Date('2023-01-02').toISOString(),
      status: BatchStatus.COMPLETED,
      totalTxns: 100,
      totalFeeInEth: 1.5,
      totalFeeInUsdt: 3000,
      updatedAt: new Date(),
    };

    it('should find a batch by ID', async () => {
      mockPrismaService.historicalTransactionsBatch.findFirstOrThrow.mockResolvedValue(
        mockBatch,
      );

      const result = await service.findHistoricalTransactionsBatch('1');

      expect(result).toEqual(mockBatch);
    });

    it('should throw NotFoundException for non-existent batch', async () => {
      mockPrismaService.historicalTransactionsBatch.findFirstOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        service.findHistoricalTransactionsBatch('999'),
      ).rejects.toThrow('Failed to find historical transactions batch by 999');
    });
  });

  describe('findHistoricalBatchTransactions', () => {
    const mockBatch: HistoricalTransactionsBatch = {
      id: 1,
      startBlock: 1000,
      endBlock: 2000,
      dateFrom: new Date('2023-01-01').toISOString(),
      dateTo: new Date('2023-01-02').toISOString(),
      status: BatchStatus.COMPLETED,
      totalTxns: 100,
      totalFeeInEth: 1.5,
      totalFeeInUsdt: 3000,
      updatedAt: new Date(),
    };

    const mockTransactions = [
      {
        id: 1,
        batchId: 1,
        transactionHash: 'hash1',
        feeInEth: '0.1',
        feeInUsdt: '200',
        createdAt: new Date(),
      },
    ];

    it('should return paginated transactions for completed batch', async () => {
      mockPrismaService.historicalTransactionsBatch.findFirstOrThrow.mockResolvedValue(
        mockBatch,
      );
      mockPrismaService.historicalTransaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const result = await service.findHistoricalBatchTransactions('1', {
        take: 50,
        offset: 0,
      });

      expect(result).toEqual({
        transactions: mockTransactions,
        totalPages: 2,
        currentPage: 1,
      });
    });

    it('should throw BadRequestException for incomplete batch', async () => {
      mockPrismaService.historicalTransactionsBatch.findFirstOrThrow.mockResolvedValue(
        {
          ...mockBatch,
          status: BatchStatus.IN_PROGRESS,
        },
      );

      await expect(
        service.findHistoricalBatchTransactions('1', { take: 50, offset: 0 }),
      ).rejects.toThrow('The batch with id 1 is not completed yet');
    });
  });

  describe('processHistoricalTransactions', () => {
    const mockJobData = {
      startBlock: 1000,
      endBlock: 2000,
      batchId: 1,
      page: 1,
    };

    const mockTransactions = [
      {
        hash: 'hash1',
        gasPrice: '1000000000',
        gas: '21000',
      },
      {
        hash: 'hash2',
        gasPrice: '1000000000',
        gas: '21000',
      },
    ];

    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { result: mockTransactions },
      });
      mockEthPriceService.getLatestEthPrice.mockResolvedValue({
        price: '2000',
      });
      mockEthPriceService.calculateFeeInUsdt.mockResolvedValue({
        feeInEth: '0.1',
        feeInUsdt: '200',
      });
    });

    it('should process transactions and update batch', async () => {
      await service.processHistoricalTransactions(mockJobData);

      expect(
        mockPrismaService.historicalTransaction.create,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockPrismaService.historicalTransactionsBatch.update,
      ).toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled(); // No more pages
    });

    it('should handle pagination and queue next page', async () => {
      const manyTransactions = Array(11)
        .fill(null)
        .map((_, i) => ({
          hash: `hash${i}`,
          gasPrice: '1000000000',
          gas: '21000',
        }));

      (axios.get as jest.Mock).mockResolvedValue({
        data: { result: manyTransactions },
      });

      await service.processHistoricalTransactions(mockJobData);
    });
  });
});
