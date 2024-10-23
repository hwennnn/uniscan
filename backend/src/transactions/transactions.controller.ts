import { Controller, Get, Param, Query } from '@nestjs/common';
import { HistoricalTransactionsBatch, Summary } from '@prisma/client';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import {
  PaginatedHistoricalTransactions,
  PaginatedTransactions,
  QueryTransaction,
} from 'src/transactions/models/transaction';
import { TransactionsService } from 'src/transactions/transactions.service';
import {
  GetHistoricaBatchTransactionsDto,
  GetHistoricalTransactionsByDatesDto,
} from './dto/get-historical-transactions.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @Get()
  async findTransactions(
    @Query() dto: GetTransactionsDto,
  ): Promise<PaginatedTransactions> {
    const parsedDto: GetTransactionsDto = {
      cursor: dto.cursor,
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      take: dto.take !== undefined ? +dto.take : undefined,
    };

    return await this.transactionService.findTransactions(parsedDto);
  }

  @Get('history')
  async getHistoricalTransactionsByDates(
    @Query() dto: GetHistoricalTransactionsByDatesDto,
  ): Promise<HistoricalTransactionsBatch> {
    const parsedDto: GetHistoricalTransactionsByDatesDto = {
      dateFrom: dto.dateFrom.toString(),
      dateTo: dto.dateTo.toString(),
    };

    return await this.transactionService.findHistoricalTransactionsByDates(
      parsedDto,
    );
  }

  @Get('history/:batchId/info')
  async getHistoricalBatchInfo(
    @Param('batchId') batchId: string,
  ): Promise<HistoricalTransactionsBatch> {
    return await this.transactionService.findHistoricalTransactionsBatch(
      batchId,
    );
  }

  @Get('history/:batchId')
  async getHistoricalBatchTransactions(
    @Param('batchId') batchId: string,
    @Query() dto: GetHistoricaBatchTransactionsDto,
  ): Promise<PaginatedHistoricalTransactions> {
    const parsedDto: GetHistoricaBatchTransactionsDto = {
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      take: dto.take !== undefined ? +dto.take : undefined,
    };

    return await this.transactionService.findHistoricalBatchTransactions(
      batchId,
      parsedDto,
    );
  }

  @Get('summary')
  async getTransactionsSummary(): Promise<Summary | null> {
    return await this.transactionService.getTransactionsSummary();
  }

  @Get(':hash')
  async findTransaction(
    @Param('hash') hash: string,
  ): Promise<QueryTransaction | null> {
    return await this.transactionService.findTransaction(hash);
  }
}
