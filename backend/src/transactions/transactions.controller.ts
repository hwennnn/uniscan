import { Controller, Get, Param, Query } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import {
  QueryTransaction,
  QueryTransactions,
} from 'src/transactions/models/transaction';
import { TransactionsService } from 'src/transactions/transactions.service';
import { GetHistoricalTransactionsDto } from './dto/get-historical-transactions.dto';

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

  @Get('history')
  async getHistoricalTransactionsDto(
    @Query() dto: GetHistoricalTransactionsDto,
  ): Promise<QueryTransactions> {
    const parsedDto: GetHistoricalTransactionsDto = {
      dateFrom: dto.dateFrom.toString(),
      dateTo: dto.dateTo.toString(),
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      page: dto.page !== undefined ? +dto.page : undefined,
    };

    return await this.transactionService.findHistoricalTransactions(parsedDto);
  }

  @Get(':hash')
  async findTransaction(
    @Param('hash') hash: string,
  ): Promise<QueryTransaction | null> {
    return await this.transactionService.findTransaction(hash);
  }
}
