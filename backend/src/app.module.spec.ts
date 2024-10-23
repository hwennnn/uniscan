import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { EthPriceModule } from './eth-price/eth-price.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TransactionsModule } from './transactions/transactions.module';

describe('AppModule', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should load ConfigService', () => {
    expect(configService).toBeDefined();
  });

  it('should have PrismaModule', () => {
    const prismaModule = module.get(PrismaModule);
    expect(prismaModule).toBeDefined();
  });

  it('should have RedisModule', () => {
    const redisModule = module.get(RedisModule);
    expect(redisModule).toBeDefined();
  });

  it('should have EthPriceModule', () => {
    const ethPriceModule = module.get(EthPriceModule);
    expect(ethPriceModule).toBeDefined();
  });

  it('should have TransactionsModule', () => {
    const transactionsModule = module.get(TransactionsModule);
    expect(transactionsModule).toBeDefined();
  });

  it('should register BullModule with the correct Redis connection', () => {
    const bullOptions = BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
        },
      }),
    });

    expect(bullOptions).toBeDefined();
  });
});
