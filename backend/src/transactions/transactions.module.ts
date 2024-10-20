import { Logger, Module } from '@nestjs/common';
import { EthPriceModule } from 'src/eth-price/eth-price.module';
import { TransactionsListenerService } from 'src/transactions/transactions.listener.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [EthPriceModule],
  controllers: [TransactionsController],
  providers: [Logger, TransactionsService, TransactionsListenerService],
})
export class TransactionsModule {}
