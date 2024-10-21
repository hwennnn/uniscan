import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction } from '@prisma/client';
import axios from 'axios';
import { EthPriceService } from 'src/eth-price/eth-price.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetTransactionsDto } from 'src/transactions/dto/get-transactions.dto';
import { INFURA_API_URL } from 'src/transactions/models/constants';
import {
  InfuraTransactionResponse,
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
}
