import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { Summary } from "../models/transaction";

type Variables = object;
type Response = Summary;

/**
 * Custom hook to fetch the transactions summary using a query.
 *
 * @function useTransactionsSummaryQuery
 * @template Response - The type of the response data.
 * @template Variables - The type of the query variables. (None required for this query)
 * @template AxiosError - The type of the error object.
 * @returns {QueryObserverResult<Response, AxiosError>} The result of the query.
 *
 * @example
 * const { data, error, isLoading } = useTransactionsSummaryQuery();
 */
export const useTransactionsSummaryQuery = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["transactions-summary"],
  fetcher: async () => {
    const response = await client
      .get<Summary>(`v1/transactions/summary`)
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
