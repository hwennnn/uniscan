import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { HistoricalTransactionsBatch } from "../models/transaction";

type Variables = {
  batchId: string;
};
type Response = HistoricalTransactionsBatch;

export const useHistoricalTransactionsBatchInfo = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["get-historical-transactions-batch-info"],
  fetcher: async (variables: Variables) => {
    const response = await client
      .get<HistoricalTransactionsBatch>(
        `v1/transactions/history/${variables.batchId}/info`
      )
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
