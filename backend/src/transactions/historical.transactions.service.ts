import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchStatus, HistoricalTransactionsBatch } from '@prisma/client';
import axios from 'axios';
import { Queue } from 'bullmq';
import { EthPriceService } from 'src/eth-price/eth-price.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetHistoricaBatchTransactionsDto,
  GetHistoricalTransactionsByDatesDto,
} from 'src/transactions/dto/get-historical-transactions.dto';
import {
  DEFAULT_HISTORICAL_TRANSACTIONS_PAGE_SIZE,
  ETHERSCAN_API_BLOCK_NUMBER_URL,
  ETHERSCAN_API_TOKEN_TRANSACTIONS_URL,
} from 'src/transactions/models/constants';
import {
  EtherscanBlockResponse,
  EtherscanHistorialTransactionResponse,
  HistoricalTransactionsJobData,
  PaginatedHistoricalTransactions,
  QueryTransaction,
} from 'src/transactions/models/transaction';

@Injectable()
export class HistoricalTransactionsService {
  private readonly etherscanApiKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly ethPriceService: EthPriceService,
    private readonly logger: Logger,
    @InjectQueue('transactions') private trasanctionsQueue: Queue,
  ) {
    this.etherscanApiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
  }

  async findHistoricalTransactionsByDates(
    dto: GetHistoricalTransactionsByDatesDto,
  ): Promise<HistoricalTransactionsBatch> {
    const { dateFrom, dateTo } = dto;

    const [startBlock, endBlock] = await Promise.all([
      this.getBlockNumberByTimestamp(dateFrom, 'after'),
      this.getBlockNumberByTimestamp(dateTo, 'before'),
    ]);

    const batch = await this.prismaService.historicalTransactionsBatch.create({
      data: {
        startBlock,
        endBlock,
        dateFrom,
        dateTo,
      },
    });

    await this.trasanctionsQueue.add('process-historical-transactions', {
      startBlock,
      endBlock,
      batchId: batch.id,
      page: 1,
    } as HistoricalTransactionsJobData);

    return batch;
  }

  async findHistoricalTransactionsBatch(
    batchId: string,
  ): Promise<HistoricalTransactionsBatch> {
    const batch = await this.prismaService.historicalTransactionsBatch
      .findFirstOrThrow({
        where: {
          id: +batchId,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find historical transactions batch by ${batchId}`,
          e instanceof Error ? e.stack : undefined,
          HistoricalTransactionsService.name,
        );

        throw new NotFoundException(
          `Failed to find historical transactions batch by ${batchId}`,
        );
      });

    return batch;
  }

  async findHistoricalBatchTransactions(
    batchId: string,
    dto: GetHistoricaBatchTransactionsDto,
  ): Promise<PaginatedHistoricalTransactions> {
    const batch = await this.prismaService.historicalTransactionsBatch
      .findFirstOrThrow({
        where: {
          id: +batchId,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find historical transactions batch by ${batchId}`,
          e instanceof Error ? e.stack : undefined,
          HistoricalTransactionsService.name,
        );

        throw new NotFoundException(
          `Failed to find historical transactions batch by ${batchId}`,
        );
      });

    if (batch.status !== BatchStatus.COMPLETED) {
      this.logger.error(`The batch with id ${batchId} is not completed yet`);

      throw new BadRequestException(
        `The batch with id ${batchId} is not completed yet`,
      );
    }

    const totalTransactions = batch.totalTxns;
    const limit = dto.take ?? 50;
    const offset = dto.offset ?? 0;

    const transactions = await this.prismaService.historicalTransaction
      .findMany({
        where: {
          batchId: batch.id,
        },
        take: limit,
        skip: offset,
        orderBy: {
          id: 'desc',
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find historical transactions for ${batchId}`,
          e instanceof Error ? e.stack : undefined,
          HistoricalTransactionsService.name,
        );

        throw new BadRequestException(
          `Failed to find historical transactions for ${batchId}`,
        );
      });

    // Step 4: Calculate totalPages and currentPage
    const totalPages = Math.ceil(totalTransactions / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      transactions,
      totalPages,
      currentPage,
    };
  }

  async processHistoricalTransactions(
    data: HistoricalTransactionsJobData,
  ): Promise<void> {
    const { startBlock, endBlock, batchId, page } = data;

    const apiUrl = ETHERSCAN_API_TOKEN_TRANSACTIONS_URL(
      page,
      DEFAULT_HISTORICAL_TRANSACTIONS_PAGE_SIZE + 1,
      startBlock,
      endBlock,
      this.etherscanApiKey,
    );

    const response =
      await axios.get<EtherscanHistorialTransactionResponse>(apiUrl);

    const transactions = response.data.result;

    const hasMore =
      transactions.length === DEFAULT_HISTORICAL_TRANSACTIONS_PAGE_SIZE + 1;

    if (hasMore) {
      transactions.pop();
    }

    const processedHashes = new Set<string>(); // Set to track unique transaction hashes

    const ethPriceInUsdt = (await this.ethPriceService.getLatestEthPrice())
      .price;

    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        if (processedHashes.has(transaction.hash)) {
          return null; // Skip if transaction hash is already processed
        }

        // Add the transaction hash to the set to avoid re-processing
        processedHashes.add(transaction.hash);

        const gasPrice = BigInt(transaction.gasPrice);
        const gasUsed = BigInt(transaction.gas);

        const { feeInEth, feeInUsdt } =
          await this.ethPriceService.calculateFeeInUsdt(
            gasPrice,
            gasUsed,
            ethPriceInUsdt,
          );

        const data: QueryTransaction = {
          transactionHash: transaction.hash,
          feeInEth,
          feeInUsdt,
        };

        return data;
      }),
    );

    // Filter out any skipped (null) transactions
    const filteredTransactions = formattedTransactions.filter(
      (transaction) => transaction !== null,
    );

    let totalFeeInEth: number = 0;
    let totalFeeInUsdt: number = 0;

    for (const transaction of filteredTransactions) {
      totalFeeInEth += parseFloat(transaction.feeInEth);
      totalFeeInUsdt += parseFloat(transaction.feeInUsdt);
      await this.prismaService.historicalTransaction.create({
        data: {
          batchId,
          transactionHash: transaction.transactionHash,
          feeInEth: transaction.feeInEth,
          feeInUsdt: transaction.feeInUsdt,
        },
      });
    }

    await this.prismaService.historicalTransactionsBatch.update({
      where: {
        id: batchId,
      },
      data: {
        status: hasMore ? BatchStatus.IN_PROGRESS : BatchStatus.COMPLETED,
        totalTxns: {
          increment: filteredTransactions.length,
        },
        totalFeeInEth: {
          increment: totalFeeInEth,
        },
        totalFeeInUsdt: {
          increment: totalFeeInUsdt,
        },
      },
    });

    if (hasMore) {
      await this.trasanctionsQueue.add('process-historical-transactions', {
        startBlock,
        endBlock,
        batchId,
        page: page + 1,
      } as HistoricalTransactionsJobData);
    }
  }

  private async getBlockNumberByTimestamp(
    timestamp: string,
    closest: 'before' | 'after',
  ): Promise<number> {
    const unixTimestamp = Math.floor(Number(timestamp) / 1000);

    const apiUrl = ETHERSCAN_API_BLOCK_NUMBER_URL(
      unixTimestamp.toString(),
      closest,
      this.etherscanApiKey,
    );

    const response = await axios.get<EtherscanBlockResponse>(apiUrl);

    const blockNumber = Number(response.data.result);

    return blockNumber;
  }
}
