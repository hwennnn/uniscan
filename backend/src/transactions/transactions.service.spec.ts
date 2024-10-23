import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Summary } from '@prisma/client';
import axios from 'axios';
import { EthPriceService } from '../eth-price/eth-price.service';
import { PrismaService } from '../prisma/prisma.service';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { TransactionsService } from './transactions.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockPrismaService = {
  transaction: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  summary: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let ethPriceService: jest.Mocked<EthPriceService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Create mock services

    const mockConfigService = {
      get: jest.fn().mockReturnValue('mock-infura-key'),
    };

    const mockEthPriceService = {
      calculateFeeInUsdt: jest.fn(),
    };

    const mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
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
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
    ethPriceService = module.get(EthPriceService);
    logger = module.get(Logger);
  });

  describe('findTransactions', () => {
    it('should return paginated transactions successfully', async () => {
      const mockTransactions = [
        { id: 3, hash: 'hash3' },
        { id: 2, hash: 'hash2' },
        { id: 1, hash: 'hash1' },
      ];

      mockPrismaService.transaction.count.mockResolvedValue(3);
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const dto: GetTransactionsDto = {
        take: 2,
        offset: 0,
      };

      const result = await service.findTransactions(dto);

      expect(result).toEqual({
        transactions: mockTransactions,
        totalPages: 2,
        currentPage: 1,
      });
    });

    it('should handle cursor-based pagination', async () => {
      const mockTransactions = [
        { id: 2, hash: 'hash2' },
        { id: 1, hash: 'hash1' },
      ];

      mockPrismaService.transaction.count.mockResolvedValue(2);
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const dto: GetTransactionsDto = {
        take: 2,
        offset: 0,
        cursor: '3',
      };

      const result = await service.findTransactions(dto);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { lte: 3 },
          },
        }),
      );
    });

    it('should throw BadRequestException when database query fails', async () => {
      mockPrismaService.transaction.findMany.mockRejectedValue(
        new Error('DB Error'),
      );

      const dto: GetTransactionsDto = {
        take: 2,
        offset: 0,
      };

      await expect(service.findTransactions(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findTransaction', () => {
    it('should return transaction details successfully', async () => {
      const mockHash = '0x123';
      const mockInfuraResponse = {
        data: {
          result: {
            hash: mockHash,
            gas: '0x5208',
            gasPrice: '0x4a817c800',
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockInfuraResponse);
      ethPriceService.calculateFeeInUsdt.mockResolvedValue({
        feeInEth: '0.1',
        feeInUsdt: '200',
      });

      const result = await service.findTransaction(mockHash);

      expect(result).toEqual({
        transactionHash: mockHash,
        feeInEth: '0.1',
        feeInUsdt: '200',
      });
    });

    it('should throw NotFoundException when transaction is not found', async () => {
      const mockHash = '0x123';
      mockedAxios.post.mockResolvedValue({
        data: {
          result: null,
        },
      });

      await expect(service.findTransaction(mockHash)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSummary', () => {
    it('should create new summary when none exists', async () => {
      const feeInEth = '0.1';
      const feeInUsdt = '200';
      const mockNewSummary: Summary = {
        id: '1',
        totalFeeETH: 0.1,
        totalFeeUSDT: 200,
        totalTxns: 1,
        updatedAt: new Date(),
      };

      mockPrismaService.summary.findMany.mockResolvedValue([]);
      mockPrismaService.summary.create.mockResolvedValue(mockNewSummary);

      await service.updateSummary(feeInEth, feeInUsdt);

      expect(prismaService.summary.create).toHaveBeenCalledWith({
        data: {
          totalFeeETH: 0.1,
          totalFeeUSDT: 200,
          totalTxns: 1,
        },
      });
      expect(logger.log).toHaveBeenCalled();
    });

    it('should update existing summary', async () => {
      const feeInEth = '0.1';
      const feeInUsdt = '200';
      const mockExistingSummary: Summary = {
        id: '1',
        totalFeeETH: 1.0,
        totalFeeUSDT: 2000,
        totalTxns: 10,
        updatedAt: new Date(),
      };
      const mockUpdatedSummary: Summary = {
        id: '1',
        totalFeeETH: 1.1,
        totalFeeUSDT: 2200,
        totalTxns: 11,
        updatedAt: new Date(),
      };

      mockPrismaService.summary.findMany.mockResolvedValue([
        mockExistingSummary,
      ]);
      mockPrismaService.summary.update.mockResolvedValue(mockUpdatedSummary);

      await service.updateSummary(feeInEth, feeInUsdt);

      expect(prismaService.summary.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          totalFeeETH: { increment: 0.1 },
          totalFeeUSDT: { increment: 200 },
          totalTxns: { increment: 1 },
        },
      });
      expect(logger.log).toHaveBeenCalled();
    });
  });

  describe('getTransactionsSummary', () => {
    it('should return summary when it exists', async () => {
      const mockSummary: Summary = {
        id: '1',
        totalFeeETH: 1.0,
        totalFeeUSDT: 2000,
        totalTxns: 10,
        updatedAt: new Date(),
      };

      mockPrismaService.summary.findMany.mockResolvedValue([mockSummary]);

      const result = await service.getTransactionsSummary();

      expect(result).toEqual(mockSummary);
    });

    it('should return null when no summary exists', async () => {
      mockPrismaService.summary.findMany.mockResolvedValue([]);

      const result = await service.getTransactionsSummary();

      expect(result).toBeNull();
    });
  });
});
