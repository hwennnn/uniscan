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
