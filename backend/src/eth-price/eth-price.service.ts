import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EthPrice } from '@prisma/client';
import axios from 'axios';
import { formatEther } from 'ethers';
import {
  BINANCE_ETH_PRICE_URL,
  ETH_PRICE_CACHE_TTL,
  LATEST_ETH_PRICE_CACHE_KEY,
} from 'src/eth-price/models/constants';
import { EthPriceResponse } from 'src/eth-price/models/price';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

/**
 * Service responsible for fetching, saving, and retrieving Ethereum price data.
 * Utilizes Prisma for database operations and Redis for caching.
 *
 * @class
 */
@Injectable()
export class EthPriceService {
  /**
   * Constructs the EthPriceService.
   *
   * @param {PrismaService} prisma - The Prisma service for database operations.
   * @param {RedisService} redisService - The Redis service for caching.
   * @param {Logger} logger - The logger service for logging information and errors.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {}

  /**
   * Lifecycle hook that is called after the module has been initialized.
   * Fetches and saves the Ethereum price.
   *
   * @async
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    await this.fetchAndSaveEthPrice();
  }

  /**
   * Fetches the current Ethereum price from Binance API and saves it to the database.
   * Scheduled to run every second.
   *
   * @async
   * @returns {Promise<void>}
   * @throws Will log an error if the fetch operation fails.
   */
  @Cron(CronExpression.EVERY_SECOND)
  async fetchAndSaveEthPrice(): Promise<void> {
    try {
      const response = await axios.get<EthPriceResponse>(BINANCE_ETH_PRICE_URL);
      const price = parseFloat(response.data.price);

      // Save to the database
      await this.prisma.ethPrice.create({
        data: {
          price,
        },
      });

      this.logger.log(
        `Saved ETH price: ${price} at ${new Date().toISOString()}`,
      );
    } catch (error) {
      this.logger.error('Error fetching ETH price:', error);
    }
  }

  /**
   * Retrieves the latest Ethereum price.
   * First attempts to fetch from Redis cache, then falls back to the database if not found.
   * Caches the fetched data in Redis for one second.
   *
   * @async
   * @returns {Promise<EthPrice | null>} The latest Ethereum price or null if not found.
   * @throws {BadRequestException} If there is an error fetching from the database.
   * @throws {NotFoundException} If no data is found in the database.
   */
  async getLatestEthPrice(): Promise<EthPrice | null> {
    const cachedData = await this.redisService.get<EthPrice>(
      LATEST_ETH_PRICE_CACHE_KEY,
    );
    if (cachedData) {
      return cachedData;
    }

    const latestPrice = await this.prisma.ethPrice
      .findFirst({
        orderBy: { timestamp: 'desc' },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find latest eth price`,
          e instanceof Error ? e.stack : undefined,
          EthPriceService.name,
        );

        throw new BadRequestException(`Failed to find latest eth price`);
      });

    if (!latestPrice) {
      throw new NotFoundException('No data found');
    }

    await this.redisService.set(
      LATEST_ETH_PRICE_CACHE_KEY,
      latestPrice,
      ETH_PRICE_CACHE_TTL,
    );

    return latestPrice;
  }

  /**
   * Calculates the transaction fee in USDT and ETH based on the gas price, gas used, and Ethereum price.
   * If the Ethereum price is not provided, it will fetch the latest price.
   *
   * @async
   * @param {bigint} gasPrice - The gas price in Wei.
   * @param {bigint} gasUsed - The amount of gas used.
   * @param {number} [ethPriceInUsdt] - The price of Ethereum in USDT. If not provided, it will fetch the latest price.
   * @returns {Promise<{ feeInUsdt: string; feeInEth: string }>} The transaction fee in USDT and ETH.
   */
  async calculateFeeInUsdt(
    gasPrice: bigint,
    gasUsed: bigint,
    ethPriceInUsdt?: number,
  ): Promise<{
    feeInUsdt: string;
    feeInEth: string;
  }> {
    const gasInWei = gasPrice * gasUsed;
    const feeInEth = formatEther(gasInWei);

    ethPriceInUsdt ??= (await this.getLatestEthPrice()).price;

    const feeInUsdt = (parseFloat(feeInEth) * ethPriceInUsdt).toString();

    return {
      feeInEth,
      feeInUsdt,
    };
  }
}
