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

/**
 * Custom hook to fetch transactions using a query.
 *
 * @function useTransactionsQuery
 * @template Response - The type of the response data.
 * @template Variables - The type of the query variables including `cursor`, `offset`, and `take`.
 * @template AxiosError - The type of the error object.
 *
 * @returns {QueryObserverResult<Response, AxiosError>} The result of the query.
 *
 * @example
 * const { data, error, isLoading } = useTransactionsQuery({
 *   variables: {
 *     cursor: "12345",
 *     offset: 0,
 *     take: 50,
 *   }
 * });
 *
 * @param {Variables} variables - The variables to be passed to the query.
 *
 */
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
