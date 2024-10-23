import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EthPrice } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EthPriceService } from './eth-price.service';
import {
  BINANCE_ETH_PRICE_URL,
  ETH_PRICE_CACHE_TTL,
  LATEST_ETH_PRICE_CACHE_KEY,
} from './models/constants';

jest.mock('axios');
jest.mock('../prisma/prisma.service');
jest.mock('../redis/redis.service');

const prismaMock = {
  ethPrice: {
    create: jest.fn(),
  },
};

describe('EthPriceService', () => {
  let service: EthPriceService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EthPriceService,
        PrismaService,
        RedisService,
        Logger,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EthPriceService>(EthPriceService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    logger = module.get<Logger>(Logger);

    prismaMock.ethPrice.create.mockReset();
  });

  describe('fetchAndSaveEthPrice', () => {
    it('should fetch and save ETH price', async () => {
      const ethPriceResponse = { data: { price: '2000.00' } };
      (axios.get as jest.Mock).mockResolvedValue(ethPriceResponse);

      prismaMock.ethPrice.create.mockResolvedValue(ethPriceResponse);

      await service.fetchAndSaveEthPrice();

      expect(axios.get).toHaveBeenCalledWith(BINANCE_ETH_PRICE_URL);
      expect(prismaMock.ethPrice.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.ethPrice.create).toHaveBeenCalledWith({
        data: { price: 2000.0 },
      });
    });

    it('should log an error if fetching ETH price fails', async () => {
      const error = new Error('Network error');
      (axios.get as jest.Mock).mockRejectedValue(error);
      logger.error = jest.fn(); // Mock the logger.error method

      await service.fetchAndSaveEthPrice();

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching ETH price:',
        error,
      );
    });
  });

  describe('getLatestEthPrice', () => {
    it('should return cached ETH price if available', async () => {
      const cachedPrice: EthPrice = {
        id: '1',
        price: 2000,
        timestamp: new Date(),
      };
      redisService.get = jest.fn().mockResolvedValue(cachedPrice);

      const result = await service.getLatestEthPrice();

      expect(redisService.get).toHaveBeenCalledWith(LATEST_ETH_PRICE_CACHE_KEY);
      expect(result).toEqual(cachedPrice);
    });

    it('should fetch ETH price from database if not cached', async () => {
      const latestPrice: EthPrice = {
        id: '1',
        price: 2000,
        timestamp: new Date(),
      };
      redisService.get = jest.fn().mockResolvedValue(null);
      prismaService.ethPrice.findFirst = jest
        .fn()
        .mockResolvedValue(latestPrice);
      redisService.set = jest.fn().mockResolvedValue(null);

      const result = await service.getLatestEthPrice();

      expect(prismaService.ethPrice.findFirst).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
      });
      expect(redisService.set).toHaveBeenCalledWith(
        LATEST_ETH_PRICE_CACHE_KEY,
        latestPrice,
        ETH_PRICE_CACHE_TTL,
      );
      expect(result).toEqual(latestPrice);
    });

    it('should throw NotFoundException if no ETH price found in database', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      prismaService.ethPrice.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.getLatestEthPrice()).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if database query fails', async () => {
      const error = new Error('Database error');
      redisService.get = jest.fn().mockResolvedValue(null);
      prismaService.ethPrice.findFirst = jest.fn().mockRejectedValue(error);

      await expect(service.getLatestEthPrice()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateFeeInUsdt', () => {
    it('should calculate fee in USDT and ETH', async () => {
      const gasPrice = BigInt(1000000000);
      const gasUsed = BigInt(21000);
      const ethPriceInUsdt = 2000;

      const result = await service.calculateFeeInUsdt(
        gasPrice,
        gasUsed,
        ethPriceInUsdt,
      );

      expect(Number(result.feeInEth)).toBeCloseTo(0.000021);
      expect(Number(result.feeInUsdt)).toBeCloseTo(0.042);
    });

    it('should fetch latest ETH price if not provided', async () => {
      const gasPrice = BigInt(1000000000);
      const gasUsed = BigInt(21000);
      const latestPrice: EthPrice = {
        id: '1',
        price: 2000,
        timestamp: new Date(),
      };
      service.getLatestEthPrice = jest.fn().mockResolvedValue(latestPrice);

      const result = await service.calculateFeeInUsdt(gasPrice, gasUsed);

      expect(service.getLatestEthPrice).toHaveBeenCalled();
      expect(Number(result.feeInEth)).toBeCloseTo(0.000021);
      expect(Number(result.feeInUsdt)).toBeCloseTo(0.042);
    });
  });
});
