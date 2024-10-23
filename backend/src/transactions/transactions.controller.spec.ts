import { Test, TestingModule } from '@nestjs/testing';
import { HistoricalTransactionsBatch, Summary } from '@prisma/client';
import {
  GetHistoricaBatchTransactionsDto,
  GetHistoricalTransactionsByDatesDto,
} from './dto/get-historical-transactions.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { HistoricalTransactionsService } from './historical.transactions.service';
import { QueryTransaction } from './models/transaction';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: jest.Mocked<TransactionsService>;
  let historicalTransactionsService: jest.Mocked<HistoricalTransactionsService>;

  beforeEach(async () => {
    // Create mock services
    const mockTransactionsService = {
      findTransactions: jest.fn(),
      findTransaction: jest.fn(),
      getTransactionsSummary: jest.fn(),
    };

    const mockHistoricalTransactionsService = {
      findHistoricalTransactionsByDates: jest.fn(),
      findHistoricalTransactionsBatch: jest.fn(),
      findHistoricalBatchTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: HistoricalTransactionsService,
          useValue: mockHistoricalTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get(TransactionsService);
    historicalTransactionsService = module.get(HistoricalTransactionsService);
  });

  describe('findTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockPaginatedTransactions = {
        transactions: [
          {
            id: 1,
            transactionHash: 'hash1',
            blockNumber: '12345',
            timestamp: new Date(),
            sender: 'senderAddress',
            recipient: 'recipientAddress',
            feeInEth: '0.01',
            feeInUsdt: '20',
          },
        ],
        totalPages: 1,
        currentPage: 1,
      };

      const dto: GetTransactionsDto = {
        take: 10,
        offset: 0,
      };

      transactionsService.findTransactions.mockResolvedValue(
        mockPaginatedTransactions,
      );

      const result = await controller.findTransactions(dto);

      expect(result).toEqual(mockPaginatedTransactions);
      expect(transactionsService.findTransactions).toHaveBeenCalledWith({
        take: 10,
        offset: 0,
      });
    });

    it('should handle undefined pagination parameters', async () => {
      const dto: GetTransactionsDto = {};
      await controller.findTransactions(dto);

      expect(transactionsService.findTransactions).toHaveBeenCalledWith({
        take: undefined,
        offset: undefined,
        cursor: undefined,
      });
    });
  });

  describe('getHistoricalTransactionsByDates', () => {
    it('should return historical transactions for date range', async () => {
      const mockBatch: HistoricalTransactionsBatch = {
        id: 1,
        dateFrom: new Date().toISOString(),
        dateTo: new Date().toISOString(),
        status: 'COMPLETED',
        updatedAt: new Date(),
        startBlock: 1000,
        endBlock: 2000,
        totalTxns: 100,
        totalFeeInEth: 1.5,
        totalFeeInUsdt: 3000,
      };

      const dto: GetHistoricalTransactionsByDatesDto = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };

      historicalTransactionsService.findHistoricalTransactionsByDates.mockResolvedValue(
        mockBatch,
      );

      const result = await controller.getHistoricalTransactionsByDates(dto);

      expect(result).toEqual(mockBatch);
      expect(
        historicalTransactionsService.findHistoricalTransactionsByDates,
      ).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });
    });
  });

  describe('getHistoricalBatchInfo', () => {
    it('should return batch information', async () => {
      const mockBatch: HistoricalTransactionsBatch = {
        id: 1,
        dateFrom: new Date().toISOString(),
        dateTo: new Date().toISOString(),
        status: 'COMPLETED',
        updatedAt: new Date(),
        startBlock: 1000,
        endBlock: 2000,
        totalTxns: 100,
        totalFeeInEth: 1.5,
        totalFeeInUsdt: 3000,
      };

      historicalTransactionsService.findHistoricalTransactionsBatch.mockResolvedValue(
        mockBatch,
      );

      const result = await controller.getHistoricalBatchInfo('1');

      expect(result).toEqual(mockBatch);
      expect(
        historicalTransactionsService.findHistoricalTransactionsBatch,
      ).toHaveBeenCalledWith('1');
    });
  });

  describe('getHistoricalBatchTransactions', () => {
    it('should return paginated historical batch transactions', async () => {
      const mockPaginatedHistoricalTransactions = {
        transactions: [
          {
            id: 1,
            transactionHash: 'hash1',
            feeInEth: '0.1',
            feeInUsdt: '200',
            batchId: 1,
          },
        ],
        totalPages: 1,
        currentPage: 1,
      };

      const dto: GetHistoricaBatchTransactionsDto = {
        take: 10,
        offset: 0,
      };

      historicalTransactionsService.findHistoricalBatchTransactions.mockResolvedValue(
        mockPaginatedHistoricalTransactions,
      );

      const result = await controller.getHistoricalBatchTransactions('1', dto);

      expect(result).toEqual(mockPaginatedHistoricalTransactions);
      expect(
        historicalTransactionsService.findHistoricalBatchTransactions,
      ).toHaveBeenCalledWith('1', {
        take: 10,
        offset: 0,
      });
    });

    it('should handle undefined pagination parameters for batch transactions', async () => {
      const dto: GetHistoricaBatchTransactionsDto = {};
      await controller.getHistoricalBatchTransactions('1', dto);

      expect(
        historicalTransactionsService.findHistoricalBatchTransactions,
      ).toHaveBeenCalledWith('1', {
        take: undefined,
        offset: undefined,
      });
    });
  });

  describe('getTransactionsSummary', () => {
    it('should return transactions summary', async () => {
      const mockSummary: Summary = {
        id: '1',
        totalFeeETH: 1.5,
        totalFeeUSDT: 3000,
        totalTxns: 100,
        updatedAt: new Date(),
      };

      transactionsService.getTransactionsSummary.mockResolvedValue(mockSummary);

      const result = await controller.getTransactionsSummary();

      expect(result).toEqual(mockSummary);
      expect(transactionsService.getTransactionsSummary).toHaveBeenCalled();
    });

    it('should return null when no summary exists', async () => {
      transactionsService.getTransactionsSummary.mockResolvedValue(null);

      const result = await controller.getTransactionsSummary();

      expect(result).toBeNull();
    });
  });

  describe('findTransaction', () => {
    it('should return transaction by hash', async () => {
      const mockTransaction: QueryTransaction = {
        transactionHash: 'hash1',
        feeInEth: '0.1',
        feeInUsdt: '200',
      };

      transactionsService.findTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.findTransaction('hash1');

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.findTransaction).toHaveBeenCalledWith('hash1');
    });

    it('should return null when transaction is not found', async () => {
      transactionsService.findTransaction.mockResolvedValue(null);

      const result = await controller.findTransaction('nonexistent');

      expect(result).toBeNull();
    });
  });
});
