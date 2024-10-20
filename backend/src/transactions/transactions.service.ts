import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  async findTransactions(dto: GetTransactionsDto): Promise<{
    transactions: Transaction[];
    hasMore: boolean;
  }> {
    const limit = dto.take ?? 50;
    const offset = dto.offset ?? 0;

    let cursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      cursor = {
        id: +dto.cursor,
      };
    }

    const transactions = await this.prismaService.transaction
      .findMany({
        take: limit + 1,
        skip: offset,
        where: {
          id: cursor ? { lte: cursor.id } : undefined,
        },
        orderBy: {
          id: 'desc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find transactions',
          e instanceof Error ? e.stack : undefined,
          TransactionsService.name,
        );

        throw new BadRequestException('Failed to find transactions');
      });

    const hasMore = transactions.length === limit + 1;
    if (hasMore) {
      transactions.pop();
    }

    return {
      transactions,
      hasMore,
    };
  }
}
