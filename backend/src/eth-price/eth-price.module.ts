import { Logger, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EthPriceController } from './eth-price.controller';
import { EthPriceService } from './eth-price.service';

@Module({
  controllers: [EthPriceController],
  providers: [Logger, EthPriceService, PrismaService, RedisService],
  exports: [EthPriceService],
})
export class EthPriceModule {}
