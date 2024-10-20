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
