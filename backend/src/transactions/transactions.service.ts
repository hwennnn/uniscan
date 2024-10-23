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

@Injectable()
export class TransactionsService {
  private readonly infuraApiKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly ethPriceService: EthPriceService,
    private readonly logger: Logger,
  ) {
    this.infuraApiKey = this.configService.get<string>('INFURA_API_KEY');
  }

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

    // Step 4: Calculate totalPages and currentPage
    const totalPages = Math.ceil(totalTransactions / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      transactions,
      totalPages,
      currentPage,
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

  async updateSummary(feeInEth: string, feeInUsdt: string): Promise<void> {
    const summaries = await this.prismaService.summary.findMany({});

    const summary = summaries.length > 0 ? summaries[0] : null;
    let newSummary: Summary;

    if (summary === null) {
      newSummary = await this.prismaService.summary.create({
        data: {
          totalFeeETH: parseFloat(feeInEth),
          totalFeeUSDT: parseFloat(feeInUsdt),
          totalTxns: 1,
        },
      });
    } else {
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

  async getTransactionsSummary(): Promise<Summary | null> {
    const summary = await this.prismaService.summary.findMany({});

    return summary.length > 0 ? summary[0] : null;
  }
}
