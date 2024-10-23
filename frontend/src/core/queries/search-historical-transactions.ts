import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { HistoricalTransactionsBatch } from "../models/transaction";

type Variables = {
  dateFrom: number;
  dateTo: number;
};
type Response = HistoricalTransactionsBatch;

/**
 * Custom hook to search historical transactions.
 *
 * This hook uses the `createQuery` function to fetch historical transaction data
 * based on the provided variables. It returns the response data or an error if the
 * request fails.
 *
 * @function useSearchHistorialTransactions
 * @template Response - The type of the response data.
 * @template Variables - The type of the variables used in the query.
 * @template AxiosError - The type of the error that may be thrown by Axios.
 *
 * @param {Variables} variables - The variables to be used as query parameters including `dateFrom` and `dateTo`.
 * @returns {Promise<Response>} - A promise that resolves to the response data.
 *
 * @example
 * const { data, error } = useSearchHistorialTransactions({ variables: { dateFrom: 12345, dateTo: 67890 } });
 */
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
