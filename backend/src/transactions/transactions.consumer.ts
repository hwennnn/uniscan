import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HistoricalTransactionsService } from './historical.transactions.service';
import { TransactionJob } from './models/constants';
import { HistoricalTransactionsJobData } from './models/transaction';

type TransactionJobData = {
  [TransactionJob.ProcessHistoricalTransactions]: HistoricalTransactionsJobData;
};

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

  async process(
    job: Job<TransactionJobData[keyof TransactionJobData], any, string>,
  ): Promise<any> {
    try {
      this.logger.log({
        message: 'Processing transaction job',
        jobId: job.id,
        jobName: job.name,
        data: job.data,
      });

      switch (job.name) {
        case TransactionJob.ProcessHistoricalTransactions:
          return await this.historicalTransactionsService.processHistoricalTransactions(
            job.data,
          );

        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return;
      }
    } catch (error) {
      this.logger.error({
        message: 'Error processing transaction job',
        jobId: job.id,
        jobName: job.name,
        error: error.message,
        stack: error.stack,
      });
      throw error; // Re-throw to let BullMQ handle the failure
    }
  }
}
