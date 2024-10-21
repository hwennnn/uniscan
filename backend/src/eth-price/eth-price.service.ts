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

@Injectable()
export class EthPriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    await this.fetchAndSaveEthPrice();
  }

  @Cron(CronExpression.EVERY_SECOND) // Schedule to run every second
  async fetchAndSaveEthPrice() {
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

  async getLatestEthPrice(): Promise<EthPrice | null> {
    // Try to fetch from Redis
    const cachedData = await this.redisService.get<EthPrice>(
      LATEST_ETH_PRICE_CACHE_KEY,
    );
    if (cachedData) {
      return cachedData;
    }

    // If not cached, fetch from the database
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

    // Cache the fetched data in Redis for one minute
    await this.redisService.set(
      LATEST_ETH_PRICE_CACHE_KEY,
      latestPrice,
      ETH_PRICE_CACHE_TTL,
    );

    return latestPrice;
  }

  async calculateFeeInUsdt(
    gasPrice: bigint,
    gasUsed: bigint,
  ): Promise<{
    feeInUsdt: string;
    feeInEth: string;
  }> {
    const gasInWei = gasPrice * gasUsed;
    const feeInEth = formatEther(gasInWei); // Multiply gasPrice by gasUsed to get fee in Wei

    const ethPriceInUsdt = (await this.getLatestEthPrice()).price;

    const feeInUsdt = (parseFloat(feeInEth) * ethPriceInUsdt).toString(); // Multiply feeInEth by ETH price to get fee in USDT

    return {
      feeInEth,
      feeInUsdt,
    };
  }
}
