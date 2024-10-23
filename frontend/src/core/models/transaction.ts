export type Transaction = {
  id: number;
  timestamp: Date;
  transactionHash: string;
  blockNumber: string;
  sender: string;
  recipient: string;
  feeInEth: string;
  feeInUsdt: string;
};

export interface PaginatedTransactions {
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
}

export type EthPrice = {
  id: string;
  price: number;
  timestamp: Date;
};

export type Summary = {
  id: string;
  totalTxns: number;
  totalFeeETH: number;
  totalFeeUSDT: number;
  updatedAt: Date;
};

export interface QueryTransaction {
  transactionHash: string;
  feeInEth: string;
  feeInUsdt: string;
}

export enum BatchStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type HistoricalTransactionsBatch = {
  id: number;
  startBlock: number;
  endBlock: number;
  dateFrom: string;
  dateTo: string;
  totalFeeInEth: number;
  totalFeeInUsdt: number;
  totalTxns: number;
  status: BatchStatus;
  updatedAt: Date;
};

export type HistoricalTransaction = {
  id: number;
  transactionHash: string;
  feeInEth: string;
  feeInUsdt: string;
};

export interface PaginatedHistoricalTransactions {
  transactions: HistoricalTransaction[];
  currentPage: number;
  totalPages: number;
}
