import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContractEventPayload, ethers, WebSocketProvider } from 'ethers';
import { EthPriceService } from 'src/eth-price/eth-price.service';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  INFURA_WEB_SOCKET_URL,
  UNISWAP_V3_POOL_ABI,
  USDC_ETH_POOL_ADDRESS,
} from 'src/transactions/models/constants';

@Injectable()
export class TransactionsListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private provider: WebSocketProvider;
  private poolContract: ethers.Contract;

  private readonly infuraApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly ethPriceService: EthPriceService,
    private readonly logger: Logger,
  ) {
    this.infuraApiKey = this.configService.get<string>('INFURA_API_KEY');
  }

  async onModuleInit() {
    await this.setupListener();
  }

  async onModuleDestroy() {
    this.provider.removeAllListeners();
    await this.provider.destroy();
  }

  private async setupListener() {
    const websocketUrl = INFURA_WEB_SOCKET_URL(this.infuraApiKey);
    this.provider = new WebSocketProvider(websocketUrl);

    this.poolContract = new ethers.Contract(
      USDC_ETH_POOL_ADDRESS,
      UNISWAP_V3_POOL_ABI,
      this.provider,
    );

    this.poolContract.on('Swap', this.handleSwapEvent.bind(this));

    this.logger.log('Listening for Uniswap V3 USDC/ETH pool swap events...');
  }

  private async handleSwapEvent(
    sender: string,
    recipient: string,
    _amount0: ethers.BigNumberish,
    _amount1: ethers.BigNumberish,
    _sqrtPriceX96: ethers.BigNumberish,
    _liquidity: ethers.BigNumberish,
    _tick: number,
    event: ContractEventPayload,
  ) {
    const transaction = await event.getTransaction();
    const block = await event.getBlock();

    const gasPrice = transaction.gasPrice;
    const gasUsed = transaction.gasLimit;
    const { feeInEth, feeInUsdt } =
      await this.ethPriceService.calculateFeeInUsdt(gasPrice, gasUsed);

    const transactionData = {
      transactionHash: transaction.hash,
      blockNumber: transaction.blockNumber.toString(),
      timestamp: new Date(block.timestamp * 1000),
      sender,
      recipient,
      feeInEth,
      feeInUsdt,
    };

    await this.prismaService.transaction.create({
      data: transactionData,
    });

    this.logger.log(
      `Processed swap event: ${transaction.hash} ${feeInEth}ETH ${feeInUsdt}USDC`,
    );
  }
}
