import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { PaginatedHistoricalTransactions } from "../models/transaction";

type Variables = {
  batchId: number;
  offset?: number;
  take?: number;
};
type Response = PaginatedHistoricalTransactions;

export const useHistoricalTransactions = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["get-historical-transactions"],
  fetcher: async (variables: Variables) => {
    const response = await client
      .get<PaginatedHistoricalTransactions>(
        `v1/transactions/history/${variables.batchId}`,
        {
          params: {
            take: variables.take,
            offset: variables.offset,
          },
        }
      )
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
