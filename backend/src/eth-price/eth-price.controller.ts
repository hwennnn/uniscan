import { Controller, Get } from '@nestjs/common';
import { EthPrice } from '@prisma/client';
import { EthPriceService } from 'src/eth-price/eth-price.service';

@Controller('eth-price')
export class EthPriceController {
  constructor(private readonly ethPriceService: EthPriceService) {}

  @Get()
  async getLatestEthPrice(): Promise<EthPrice | null> {
    return this.ethPriceService.getLatestEthPrice();
  }
}
