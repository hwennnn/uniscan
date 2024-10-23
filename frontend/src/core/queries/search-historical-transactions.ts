import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { HistoricalTransactionsBatch } from "../models/transaction";

type Variables = {
  dateFrom: number;
  dateTo: number;
};
type Response = HistoricalTransactionsBatch;

export const useSearchHistorialTransactions = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["search-historical-transactions"],
  fetcher: async (variables: Variables) => {
    const response = await client
      .get<HistoricalTransactionsBatch>(`v1/transactions/history`, {
        params: {
          ...variables,
        },
      })
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
