import { Controller, Get } from '@nestjs/common';
import { EthPrice } from '@prisma/client';
import { EthPriceService } from './eth-price.service';

/**
 * Controller for handling Ethereum price related requests.
 *
 * @class EthPriceController
 * @constructor
 * @param {EthPriceService} ethPriceService - The service used to fetch Ethereum price data.
 */

@Controller('eth-price')
export class EthPriceController {
  constructor(private readonly ethPriceService: EthPriceService) {}

  /**
   * Retrieves the latest Ethereum price.
   * The API end point is `/eth-price`.
   *
   * @method getLatestEthPrice
   * @returns {Promise<EthPrice | null>} A promise that resolves to the latest Ethereum price or null if not available.
   */
  @Get()
  async getLatestEthPrice(): Promise<EthPrice | null> {
    return this.ethPriceService.getLatestEthPrice();
  }
}
