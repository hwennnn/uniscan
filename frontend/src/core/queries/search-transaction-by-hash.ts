import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { QueryTransaction } from "../models/transaction";

type Variables = {
  hash: string;
};
type Response = QueryTransaction | null;

/**
 * Custom hook to search for a transaction by its hash.
 *
 * This hook uses the `createQuery` function to create a query that fetches
 * transaction data from the API based on the provided hash.
 *
 * @function useSearchTransactionByHashQuery
 * @template Response - The expected response type from the API.
 * @template Variables - The variables required for the query, including the transaction hash.
 * @template AxiosError - The error type that may be thrown by Axios.
 *
 * @param {Object} options - The options for the query.
 * @param {Array} options.queryKey - The key for the query, used for caching and refetching.
 * @param {Function} options.fetcher - The function that fetches the transaction data.
 * @param {Variables} options.fetcher.variables - The variables required for the fetcher, including the transaction `hash`.
 *
 * @returns {Response} The transaction data fetched from the API.
 *
 * @throws {AxiosError} If the API request fails.
 */
export const useSearchTransactionByHashQuery = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["transaction"],
  fetcher: async (variables: Variables) => {
    const response = await client
      .get<QueryTransaction>(`v1/transactions/${variables.hash}`)
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
