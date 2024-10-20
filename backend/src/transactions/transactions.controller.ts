import { Controller, Get, Param, Query } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import { QueryTransaction } from 'src/transactions/models/transaction';
import { TransactionsService } from 'src/transactions/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @Get()
  async findTransactions(
    @Query() dto: GetTransactionsDto,
  ): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
    const parsedDto: GetTransactionsDto = {
      cursor: dto.cursor,
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      take: dto.take !== undefined ? +dto.take : undefined,
    };

    return await this.transactionService.findTransactions(parsedDto);
  }

  @Get(':hash')
  async findTransaction(
    @Param('hash') hash: string,
  ): Promise<QueryTransaction | null> {
    return await this.transactionService.findTransaction(hash);
  }
}
