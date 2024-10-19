import { Logger, Module } from '@nestjs/common';
import { EthPriceService } from 'src/eth-price/eth-price.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { EthPriceController } from './eth-price.controller';

@Module({
  controllers: [EthPriceController],
  providers: [Logger, EthPriceService, PrismaService, RedisService],
  exports: [EthPriceService],
})
export class EthPriceModule {}
