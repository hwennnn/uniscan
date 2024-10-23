import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EthPriceController } from './eth-price.controller';
import { EthPriceModule } from './eth-price.module';
import { EthPriceService } from './eth-price.service';

describe('EthPriceModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EthPriceModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(RedisService)
      .useValue({})
      .overrideProvider(Logger)
      .useValue({ log: jest.fn(), error: jest.fn(), warn: jest.fn() })
      .compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide EthPriceService', () => {
    const service = module.get<EthPriceService>(EthPriceService);
    expect(service).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should provide RedisService', () => {
    const redisService = module.get<RedisService>(RedisService);
    expect(redisService).toBeDefined();
  });

  it('should provide Logger', () => {
    const logger = module.get<Logger>(Logger);
    expect(logger).toBeDefined();
  });

  it('should provide EthPriceController', () => {
    const controller = module.get<EthPriceController>(EthPriceController);
    expect(controller).toBeDefined();
  });
});
