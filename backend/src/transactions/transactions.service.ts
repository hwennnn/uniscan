import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction } from '@prisma/client';
import axios from 'axios';
import { EthPriceService } from 'src/eth-price/eth-price.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetHistoricalTransactionsDto } from 'src/transactions/dto/get-historical-transactions.dto';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import {
  ETHERSCAN_API_BLOCK_NUMBER_URL,
  ETHERSCAN_API_TOKEN_TRANSACTIONS_URL,
  INFURA_API_URL,
} from 'src/transactions/models/constants';
import {
  EtherscanBlockResponse,
  EtherscanHistorialTransactionResponse,
  InfuraTransactionResponse,
  QueryTransaction,
  QueryTransactions,
} from 'src/transactions/models/transaction';

@Injectable()
export class TransactionsService {
  private readonly infuraApiKey: string;
  private readonly etherscanApiKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly ethPriceService: EthPriceService,
    private readonly logger: Logger,
  ) {
    this.infuraApiKey = this.configService.get<string>('INFURA_API_KEY');
    this.etherscanApiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
  }

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

  async findTransaction(hash: string): Promise<QueryTransaction | null> {
    const infuraApiUrl = INFURA_API_URL(this.infuraApiKey);

    const response = await axios.post<InfuraTransactionResponse>(
      infuraApiUrl,
      {
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [hash],
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const result = response.data.result;

    if (!result.hash || !result.gas || !result.gasPrice) {
      return null;
    }

    const gasPrice = BigInt(result.gasPrice);
    const gasUsed = BigInt(result.gas);

    const { feeInEth, feeInUsdt } =
      await this.ethPriceService.calculateFeeInUsdt(gasPrice, gasUsed);

    const transaction: QueryTransaction = {
      transactionHash: result.hash,
      feeInEth,
      feeInUsdt,
    };

    return transaction;
  }

  async findHistoricalTransactions(
    dto: GetHistoricalTransactionsDto,
  ): Promise<QueryTransactions> {
    const startBlock = await this.getBlockNumberByTimestamp(
      dto.dateFrom,
      'after',
    );
    const endBlock = await this.getBlockNumberByTimestamp(dto.dateTo, 'before');
    const page = dto.page ?? 1;
    const offset = dto.offset ?? 100;

    const transactions = await this.getHistoricalTransactionsByBatch(
      startBlock,
      endBlock,
      page,
      offset,
    );

    return transactions;
  }

  private async getHistoricalTransactionsByBatch(
    startBlock: number,
    endBlock: number,
    page: number,
    offset: number,
  ): Promise<QueryTransactions> {
    const apiUrl = ETHERSCAN_API_TOKEN_TRANSACTIONS_URL(
      page,
      offset + 1,
      startBlock,
      endBlock,
      this.etherscanApiKey,
    );

    const response =
      await axios.get<EtherscanHistorialTransactionResponse>(apiUrl);

    const transactions = response.data.result;
    const hasMore = transactions.length === offset + 1;

    if (hasMore) {
      transactions.pop();
    }

    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const gasPrice = BigInt(transaction.gasPrice);
        const gasUsed = BigInt(transaction.gas);

        const { feeInEth, feeInUsdt } =
          await this.ethPriceService.calculateFeeInUsdt(gasPrice, gasUsed);

        const data: QueryTransaction = {
          transactionHash: transaction.hash,
          feeInEth,
          feeInUsdt,
        };

        return data;
      }),
    );

    return {
      transactions: formattedTransactions,
      hasMore,
      page,
    };
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
