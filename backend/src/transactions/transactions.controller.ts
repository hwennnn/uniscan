import { Controller, Get, Query } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import { TransactionsService } from 'src/transactions/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @Get()
  async findPosts(
    @Query() dto: GetTransactionsDto,
  ): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
    const parsedDto: GetTransactionsDto = {
      cursor: dto.cursor,
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      take: dto.take !== undefined ? +dto.take : undefined,
    };

    return await this.transactionService.findTransactions(parsedDto);
  }
}
