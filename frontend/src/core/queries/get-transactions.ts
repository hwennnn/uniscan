import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { PaginatedTransactions } from "../models/transaction";

type Variables = {
  cursor?: string;
  offset?: number;
  take?: number;
};
type Response = PaginatedTransactions;

export const useTransactionsQuery = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["transactions"],
  fetcher: async (variables: Variables) => {
    const response = await client
      .get<PaginatedTransactions>(`v1/transactions`, {
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
