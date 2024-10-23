import { HistoricalTransaction, Transaction } from '@prisma/client';

export interface InfuraTransactionResponse {
  jsonrpc: string;
  id: string;
  result:
    | Partial<{
        blockHash: string;
        blockNumber: string;
        chainId: string;
        from: string;
        gas: string;
        gasPrice: string;
        hash: string;
        input: string;
        nonce: string;
        r: string;
        s: string;
        to: string | null;
        transactionIndex: string;
        type: string;
        v: string;
        value: string;
      }>
    | null
    | undefined;
}

export interface QueryTransaction {
  transactionHash: string;
  feeInEth: string;
  feeInUsdt: string;
}

export interface EtherscanBlockResponse {
  status: string;
  message: string;
  result: string;
}

export interface EtherscanHistorialTransactionResponse {
  status: string;
  message: string;
  result: EtherscanHistorialTransaction[];
}

export interface EtherscanHistorialTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export interface QueryTransactions {
  transactions: QueryTransaction[];
  hasMore: boolean;
  page: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
}

export interface PaginatedHistoricalTransactions {
  transactions: HistoricalTransaction[];
  currentPage: number;
  totalPages: number;
}
