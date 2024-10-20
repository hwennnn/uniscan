import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContractEventPayload,
  ethers,
  formatEther,
  WebSocketProvider,
} from 'ethers';
import { EthPriceService } from 'src/eth-price/eth-price.service';
import { PrismaService } from 'src/prisma/prisma.service';

// ABI for the Uniswap V3 Pool contract
const UNISWAP_V3_POOL_ABI = [
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
];

@Injectable()
export class TransactionsListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private provider: WebSocketProvider;
  private poolContract: ethers.Contract;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly ethPriceService: EthPriceService,
    private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    await this.setupListener();
  }

  async onModuleDestroy() {
    this.provider.removeAllListeners();
    await this.provider.destroy();
  }

  private async setupListener() {
    const websocketUrl = this.configService.get<string>(
      'ETHEREUM_WEBSOCKET_URL',
    );
    this.provider = new WebSocketProvider(websocketUrl);

    const poolAddress = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'; // USDC/ETH pool address
    this.poolContract = new ethers.Contract(
      poolAddress,
      UNISWAP_V3_POOL_ABI,
      this.provider,
    );

    this.poolContract.on('Swap', this.handleSwapEvent.bind(this));

    console.log('Listening for Uniswap V3 USDC/ETH pool swap events...');
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
    const gasInWei = gasPrice * gasUsed;
    const feeInEth = formatEther(gasInWei); // Multiply gasPrice by gasUsed to get fee in Wei

    const ethPriceInUsdt = (await this.ethPriceService.getLatestEthPrice())
      .price;

    const feeInUsdt = (parseFloat(feeInEth) * ethPriceInUsdt).toFixed(4); // Multiply feeInEth by ETH price to get fee in USDT
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
      `Processed swap event: ${transaction.hash} ${feeInEth} ${feeInUsdt}`,
    );
  }
}
