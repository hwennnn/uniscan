import { Controller, Get, Param, Query } from '@nestjs/common';
import { HistoricalTransactionsBatch, Summary } from '@prisma/client';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import { HistoricalTransactionsService } from 'src/transactions/historical.transactions.service';
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

/**
 * Controller for handling transaction-related requests.
 */
@Controller('transactions')
export class TransactionsController {
  /**
   * Constructs a new TransactionsController.
   * @param transactionsService - Service for handling transactions.
   * @param historialTransactionService - Service for handling historical transactions.
   */
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly historialTransactionService: HistoricalTransactionsService,
  ) {}

  /**
   * Retrieves a list of transactions based on the provided query parameters.
   * The API end point is `/transactions`.
   * @param dto - Data transfer object containing query parameters for transactions.
   * @returns A promise that resolves to a paginated list of transactions.
   */
  @Get()
  async findTransactions(
    @Query() dto: GetTransactionsDto,
  ): Promise<PaginatedTransactions> {
    const parsedDto: GetTransactionsDto = {
      cursor: dto.cursor,
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      take: dto.take !== undefined ? +dto.take : undefined,
    };

    return await this.transactionsService.findTransactions(parsedDto);
  }

  /**
   * Retrieves historical transactions within the specified date range.
   * The API end point is `/transactions/history`.
   * @param dto - Data transfer object containing the date range for historical transactions.
   * @returns A promise that resolves to a batch of historical transactions.
   */
  @Get('history')
  async getHistoricalTransactionsByDates(
    @Query() dto: GetHistoricalTransactionsByDatesDto,
  ): Promise<HistoricalTransactionsBatch> {
    const parsedDto: GetHistoricalTransactionsByDatesDto = {
      dateFrom: dto.dateFrom.toString(),
      dateTo: dto.dateTo.toString(),
    };

    return await this.historialTransactionService.findHistoricalTransactionsByDates(
      parsedDto,
    );
  }

  /**
   * Retrieves information about a specific historical transaction batch.
   * The API end point is `/transactions/history/:batchId/info`.
   * @param batchId - The ID of the historical transaction batch.
   * @returns A promise that resolves to the historical transaction batch information.
   */
  @Get('history/:batchId/info')
  async getHistoricalBatchInfo(
    @Param('batchId') batchId: string,
  ): Promise<HistoricalTransactionsBatch> {
    return await this.historialTransactionService.findHistoricalTransactionsBatch(
      batchId,
    );
  }

  /**
   * Retrieves transactions from a specific historical transaction batch.
   * The API end point is `/transactions/history/:batchId`.
   * @param batchId - The ID of the historical transaction batch.
   * @param dto - Data transfer object containing query parameters for the batch transactions.
   * @returns A promise that resolves to a paginated list of historical transactions.
   */
  @Get('history/:batchId')
  async getHistoricalBatchTransactions(
    @Param('batchId') batchId: string,
    @Query() dto: GetHistoricaBatchTransactionsDto,
  ): Promise<PaginatedHistoricalTransactions> {
    const parsedDto: GetHistoricaBatchTransactionsDto = {
      offset: dto.offset !== undefined ? +dto.offset : undefined,
      take: dto.take !== undefined ? +dto.take : undefined,
    };

    return await this.historialTransactionService.findHistoricalBatchTransactions(
      batchId,
      parsedDto,
    );
  }

  /**
   * Retrieves a summary of transactions.
   * The API end point is `/transactions/summary`.
   * @returns A promise that resolves to the transaction summary or null if not available.
   */

  @Get('summary')
  async getTransactionsSummary(): Promise<Summary | null> {
    return await this.transactionsService.getTransactionsSummary();
  }

  /**
   * Retrieves a specific transaction by its hash.
   * The API end point is `/transactions/:hash`.
   * @param hash - The hash of the transaction.
   * @returns A promise that resolves to the transaction or null if not found.
   */
  @Get(':hash')
  async findTransaction(
    @Param('hash') hash: string,
  ): Promise<QueryTransaction | null> {
    return await this.transactionsService.findTransaction(hash);
  }
}
