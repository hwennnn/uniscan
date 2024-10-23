import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  let prismaService: PrismaService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    logger = module.get<Logger>(Logger);
  });

  it('should provide PrismaService', () => {
    expect(prismaService).toBeDefined();
  });

  it('should provide Logger', () => {
    expect(logger).toBeDefined();
  });
});
