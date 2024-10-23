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

/**
 * Custom hook to fetch historical transactions using a query.
 *
 * @function useHistoricalTransactions
 * @template Response - The type of the response data.
 * @template Variables - The type of the variables used in the query.
 * @template AxiosError - The type of the error that might be thrown by Axios.
 *
 * @returns {QueryResult<Response, AxiosError>} The result of the query, including data, error, and status.
 *
 * @example
 * const { data, error, status } = useHistoricalTransactions({
 *   variables: {
 *     batchId: '12345',
 *     take: 10,
 *     offset: 0,
 *   },
 * });
 * @param {Variables} variables - The variables required for the query, including `batchId`, `take`, and `offset`.
 *
 * @throws {AxiosError} If the API call fails, the error is caught and propagated.
 */
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
