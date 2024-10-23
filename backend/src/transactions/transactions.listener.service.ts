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
import { TransactionsService } from 'src/transactions/transactions.service';

/**
 * @class TransactionsListenerService
 * @implements {OnModuleInit, OnModuleDestroy}
 * @description This service listens for Uniswap V3 USDC/ETH pool swap events and processes them.
 *
 */
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
    private readonly transactionsService: TransactionsService,
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

  /**
   * Sets up a listener for Uniswap V3 USDC/ETH pool swap events.
   *
   * This method initializes a WebSocket connection to the Infura endpoint using the provided API key,
   * creates a contract instance for the USDC/ETH pool using the Uniswap V3 pool ABI, and sets up an
   * event listener for 'Swap' events. When a swap event occurs, the `handleSwapEvent` method is invoked.
   *
   * @private
   * @async
   * @returns {Promise<void>} A promise that resolves when the listener is successfully set up.
   */
  private async setupListener(): Promise<void> {
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

  /**
   * Handles the swap event by processing transaction details, calculating fees,
   * and updating the transaction summary.
   *
   * @param sender - The address of the sender.
   * @param recipient - The address of the recipient.
   * @param _amount0 - The amount of token0 involved in the swap.
   * @param _amount1 - The amount of token1 involved in the swap.
   * @param _sqrtPriceX96 - The square root price of the swap.
   * @param _liquidity - The liquidity of the swap.
   * @param _tick - The tick of the swap.
   * @param event - The contract event payload containing transaction and block details.
   * @returns A promise that resolves when the swap event has been processed.
   */
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

    // Save the transaction to the database
    await this.prismaService.transaction.create({
      data: transactionData,
    });

    // Update the transaction summary
    await this.transactionsService.updateSummary(feeInEth, feeInUsdt);

    this.logger.log(
      `Processed swap event: ${transaction.hash} ${feeInEth}ETH ${feeInUsdt}USDC`,
    );
  }
}
