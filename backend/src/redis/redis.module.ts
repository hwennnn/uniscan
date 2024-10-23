import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
  providers: [ConfigService, Logger, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
