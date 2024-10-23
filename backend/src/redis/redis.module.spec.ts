import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from './redis.module';
import { RedisService } from './redis.service';

describe('RedisModule', () => {
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(redisService).toBeDefined();
  });

  it('should provide RedisService', () => {
    expect(redisService).toBeInstanceOf(RedisService);
  });

  it('should provide Logger', () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
  });
});
