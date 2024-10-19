import { Controller, Get } from '@nestjs/common';
import { EthPrice } from '@prisma/client';
import { EthPriceService } from 'src/eth-price/eth-price.service';

@Controller('eth-price')
export class EthPriceController {
  constructor(private readonly ethPriceService: EthPriceService) {}

  @Get('summary')
  async getSummary(): Promise<EthPrice | null> {
    return this.ethPriceService.getSummary();
  }
}
