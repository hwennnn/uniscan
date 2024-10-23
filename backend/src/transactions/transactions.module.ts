import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { EthPriceModule } from 'src/eth-price/eth-price.module';
import { HistoricalTransactionsService } from 'src/transactions/historical.transactions.service';
import { TransactionsConsumer } from 'src/transactions/transactions.consumer';
import { TransactionsListenerService } from 'src/transactions/transactions.listener.service';
import { TransactionsController } from './transactions.controller';
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
