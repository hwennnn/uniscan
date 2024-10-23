import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { EthPriceModule } from '../eth-price/eth-price.module';
import { HistoricalTransactionsService } from './historical.transactions.service';
import { TransactionsConsumer } from './transactions.consumer';
import { TransactionsController } from './transactions.controller';
import { TransactionsListenerService } from './transactions.listener.service';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    EthPriceModule,
    BullModule.registerQueue({
      name: 'transactions',
    }),
  ],
  controllers: [TransactionsController],
  providers: [
    Logger,
    TransactionsService,
    HistoricalTransactionsService,
    TransactionsListenerService,
    TransactionsConsumer,
  ],
})
export class TransactionsModule {}
