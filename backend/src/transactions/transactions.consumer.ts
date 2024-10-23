import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HistoricalTransactionsService } from 'src/transactions/historical.transactions.service';
import { HistoricalTransactionsJobData } from 'src/transactions/models/transaction';

enum TransactionJob {
  ProcessHistoricalTransactions = 'process-historical-transactions',
}

/**
 * Consumer class for processing transaction-related jobs.
 *
 * @class TransactionsConsumer
 * @extends WorkerHost
 * @decorator Processor
 *
 * @param {HistoricalTransactionsService} historicalTransactionsService - Service for processing historical transactions.
 * @param {Logger} logger - Logger for logging job processing information.
 */
@Processor('transactions')
export class TransactionsConsumer extends WorkerHost {
  constructor(
    private readonly historicalTransactionsService: HistoricalTransactionsService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log('Transactions MQ: Processing job ', job.id, job.name);

    switch (job.name) {
      case TransactionJob.ProcessHistoricalTransactions:
        const jobData: HistoricalTransactionsJobData = job.data;
        return await this.historicalTransactionsService.processHistoricalTransactions(
          jobData,
        );

      default:
        return;
    }
  }
}
