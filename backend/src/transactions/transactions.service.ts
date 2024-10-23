import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Summary } from '@prisma/client';
import axios from 'axios';
import { EthPriceService } from 'src/eth-price/eth-price.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import { INFURA_API_URL } from 'src/transactions/models/constants';
import {
  InfuraTransactionResponse,
  PaginatedTransactions,
  QueryTransaction,
} from 'src/transactions/models/transaction';

/**
 * Service responsible for handling transactions.
 */
@Injectable()
export class TransactionsService {
  private readonly infuraApiKey: string;

  /**
   * Creates an instance of TransactionsService.
   * @param prismaService - The Prisma service for database operations.
   * @param configService - The configuration service for accessing environment variables.
   * @param ethPriceService - The service for fetching Ethereum price data.
   * @param logger - The logger service for logging information and errors.
   */
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly ethPriceService: EthPriceService,
    private readonly logger: Logger,
  ) {
    this.infuraApiKey = this.configService.get<string>('INFURA_API_KEY');
  }

  /**
   * Finds transactions based on the provided DTO.
   * @param dto - The data transfer object containing query parameters.
   * @returns A promise that resolves to a paginated list of transactions.
   * @throws BadRequestException if the transactions cannot be found.
   */
  async findTransactions(
    dto: GetTransactionsDto,
  ): Promise<PaginatedTransactions> {
    const limit = dto.take ?? 50;
    const offset = dto.offset ?? 0;

    let cursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      cursor = {
        id: +dto.cursor,
      };
    }

    // Step 1: Count total transactions to calculate totalPages
    const totalTransactions = await this.prismaService.transaction.count({
      where: {
        id: cursor ? { lte: cursor.id } : undefined,
      },
    });

    // Step 2: Find transactions based on the query parameters
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

    // Step 3: Check if there are more transactions
    // We are fetching limit + 1 transactions to check if there are more transactions
    const hasMore = transactions.length === limit + 1;
    if (hasMore) {
      transactions.pop();
    }

    // Step 4: Calculate totalPages and currentPage
    const totalPages = Math.ceil(totalTransactions / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      transactions,
      totalPages,
      currentPage,
    };
  }

  /**
   * Finds a transaction by its hash.
   * @param hash - The hash of the transaction to find.
   * @returns A promise that resolves to the transaction details or null if not found.
   * @throws NotFoundException if the transaction with the given hash is not found.
   */
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

    // Check if the transaction was found based on the required fields
    // which are hash, gas, and gasPrice
    if (!result || !result.hash || !result.gas || !result.gasPrice) {
      throw new NotFoundException(
        'The transaction with the given hash was not found',
      );
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

  /**
   * Updates the transaction summary with the provided fees.
   * @param feeInEth - The transaction fee in ETH.
   * @param feeInUsdt - The transaction fee in USDT.
   * @returns A promise that resolves when the summary is updated.
   */
  /**
   * Updates the transaction summary with the provided fees.
   * @param feeInEth - The transaction fee in ETH.
   * @param feeInUsdt - The transaction fee in USDT.
   * @returns A promise that resolves when the summary is updated.
   */
  async updateSummary(feeInEth: string, feeInUsdt: string): Promise<void> {
    // Retrieve all summaries from the database (there should be only one)
    const summaries = await this.prismaService.summary.findMany({});

    // Check if there is an existing summary
    const summary = summaries.length > 0 ? summaries[0] : null;
    let newSummary: Summary;

    if (summary === null) {
      // If no summary exists, create a new one with the provided fees and set total transactions to 1
      newSummary = await this.prismaService.summary.create({
        data: {
          totalFeeETH: parseFloat(feeInEth),
          totalFeeUSDT: parseFloat(feeInUsdt),
          totalTxns: 1,
        },
      });
    } else {
      // If a summary exists, update it by incrementing the fees and total transactions
      newSummary = await this.prismaService.summary.update({
        where: {
          id: summary.id,
        },
        data: {
          totalFeeETH: {
            increment: parseFloat(feeInEth),
          },
          totalFeeUSDT: {
            increment: parseFloat(feeInUsdt),
          },
          totalTxns: {
            increment: 1,
          },
        },
      });
    }

    this.logger.log(
      `Updated Summary: ${newSummary.totalFeeETH}ETH ${newSummary.totalFeeUSDT}USDT ${newSummary.totalTxns} txns`,
    );
  }

  /**
   * Retrieves the transaction summary.
   * @returns A promise that resolves to the transaction summary or null if not found.
   */
  async getTransactionsSummary(): Promise<Summary | null> {
    // Retrieve all summaries from the database (there should be only one)
    const summary = await this.prismaService.summary.findMany({});

    // Return the first (and only) summary if it exists, otherwise return null
    return summary.length > 0 ? summary[0] : null;
  }
}
