import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchStatus } from '@prisma/client';
import axios from 'axios';
import { Queue } from 'bullmq';
import { EthPriceService } from '../eth-price/eth-price.service';
import { PrismaService } from '../prisma/prisma.service';
import { HistoricalTransactionsService } from './historical.transactions.service';
import { TransactionsConsumer } from './transactions.consumer';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TransactionsConsumer', () => {
  let consumer: TransactionsConsumer;
  let historicalTransactionsService: HistoricalTransactionsService;
  let prismaService: PrismaService;
  let ethPriceService: EthPriceService;
  let transactionsQueue: Queue;
  let logger: jest.Mocked<Logger>;

  const mockTransaction = {
    hash: '0x123',
    gasPrice: '20000000000',
    gas: '21000',
  };

  const mockEthPrice = {
    price: '2000.00',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        TransactionsConsumer,
        HistoricalTransactionsService,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            historicalTransaction: {
              create: jest.fn(),
            },
            historicalTransactionsBatch: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: EthPriceService,
          useValue: {
            getLatestEthPrice: jest.fn().mockResolvedValue(mockEthPrice),
            calculateFeeInUsdt: jest.fn().mockResolvedValue({
              feeInEth: '0.00042',
              feeInUsdt: '0.84',
            }),
          },
        },
        {
          provide: 'BullQueue_transactions',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    consumer = module.get<TransactionsConsumer>(TransactionsConsumer);
    historicalTransactionsService = module.get<HistoricalTransactionsService>(
      HistoricalTransactionsService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    ethPriceService = module.get<EthPriceService>(EthPriceService);
    transactionsQueue = module.get('BullQueue_transactions');
    logger = module.get(Logger);
  });

  describe('processHistoricalTransactions', () => {
    const jobData = {
      batchId: 1,
      startBlock: 1000000,
      endBlock: 1000100,
      page: 1,
    };

    it('should process a page of transactions successfully', async () => {
      // Mock API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          result: [mockTransaction],
        },
      });

      await historicalTransactionsService.processHistoricalTransactions(
        jobData,
      );

      // Verify ETH price was fetched
      expect(ethPriceService.getLatestEthPrice).toHaveBeenCalled();

      // Verify transaction was saved
      expect(prismaService.historicalTransaction.create).toHaveBeenCalledWith({
        data: {
          batchId: jobData.batchId,
          transactionHash: mockTransaction.hash,
          feeInEth: '0.00042',
          feeInUsdt: '0.84',
        },
      });

      // Verify batch was updated
      expect(
        prismaService.historicalTransactionsBatch.update,
      ).toHaveBeenCalledWith({
        where: { id: jobData.batchId },
        data: {
          status: BatchStatus.COMPLETED,
          totalTxns: { increment: 1 },
          totalFeeInEth: { increment: 0.00042 },
          totalFeeInUsdt: { increment: 0.84 },
        },
      });
    });

    it('should handle pagination when there are more transactions', async () => {
      const DEFAULT_PAGE_SIZE = 100;
      // Create array of DEFAULT_PAGE_SIZE + 1 transactions to trigger pagination
      const transactions = Array(DEFAULT_PAGE_SIZE + 1)
        .fill(null)
        .map((_, index) => ({
          ...mockTransaction,
          hash: `0x${index}`,
        }));

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          result: transactions,
        },
      });

      await historicalTransactionsService.processHistoricalTransactions(
        jobData,
      );

      // Verify next page job was queued
      expect(transactionsQueue.add).toHaveBeenCalledWith(
        'process-historical-transactions',
        {
          ...jobData,
          page: jobData.page + 1,
        },
      );

      // Verify batch status was set to IN_PROGRESS
      expect(
        prismaService.historicalTransactionsBatch.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BatchStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('should handle duplicate transactions', async () => {
      // Mock API response with duplicate transactions
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          result: [
            mockTransaction,
            mockTransaction, // Duplicate
            { ...mockTransaction, hash: '0x456' }, // Different transaction
          ],
        },
      });

      await historicalTransactionsService.processHistoricalTransactions(
        jobData,
      );

      // Verify only unique transactions were processed
      expect(prismaService.historicalTransaction.create).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(
        historicalTransactionsService.processHistoricalTransactions(jobData),
      ).rejects.toThrow('API Error');
    });

    it('should process empty transaction list', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          result: [],
        },
      });

      await historicalTransactionsService.processHistoricalTransactions(
        jobData,
      );

      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        `No transactions found for batch ${jobData.batchId}`,
      );

      // Verify batch was updated with zero increments
      expect(
        prismaService.historicalTransactionsBatch.update,
      ).toHaveBeenCalledWith({
        where: { id: jobData.batchId },
        data: {
          status: BatchStatus.COMPLETED,
        },
      });
    });
  });

  describe('TransactionsConsumer', () => {
    it('should handle unknown job types', async () => {
      const job = {
        id: '1',
        name: 'unknown-job',
        data: {},
      };

      await consumer.process(job as any);
      expect(logger.warn).toHaveBeenCalledWith('Unknown job type: unknown-job');
    });
  });
});
