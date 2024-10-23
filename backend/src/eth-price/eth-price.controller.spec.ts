import { Test, TestingModule } from '@nestjs/testing';
import { EthPrice } from '@prisma/client';
import { EthPriceController } from './eth-price.controller';
import { EthPriceService } from './eth-price.service';

describe('EthPriceController', () => {
  let controller: EthPriceController;
  let service: EthPriceService;

  const mockEthPriceService = {
    getLatestEthPrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EthPriceController],
      providers: [
        {
          provide: EthPriceService,
          useValue: mockEthPriceService,
        },
      ],
    }).compile();

    controller = module.get<EthPriceController>(EthPriceController);
    service = module.get<EthPriceService>(EthPriceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLatestEthPrice', () => {
    it('should return the latest ETH price', async () => {
      const ethPrice: EthPrice = {
        id: '1',
        price: 2000,
        timestamp: new Date(),
      };
      mockEthPriceService.getLatestEthPrice.mockResolvedValue(ethPrice);

      const result = await controller.getLatestEthPrice();

      expect(result).toEqual(ethPrice);
      expect(service.getLatestEthPrice).toHaveBeenCalled();
    });

    it('should return null if no ETH price is available', async () => {
      mockEthPriceService.getLatestEthPrice.mockResolvedValue(null);

      const result = await controller.getLatestEthPrice();

      expect(result).toBeNull();
      expect(service.getLatestEthPrice).toHaveBeenCalled();
    });
  });
});
