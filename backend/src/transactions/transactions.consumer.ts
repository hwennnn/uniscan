import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HistoricalTransactionsService } from 'src/transactions/historical.transactions.service';
import { HistoricalTransactionsJobData } from 'src/transactions/models/transaction';

enum TransactionJob {
  ProcessHistoricalTransactions = 'process-historical-transactions',
}

@Processor('transactions')
export class TransactionsConsumer extends WorkerHost {
  constructor(
    private readonly historicalTransactionsService: HistoricalTransactionsService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log('Processing job ', job.id, job.data);

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
