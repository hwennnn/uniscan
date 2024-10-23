import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { HistoricalTransactionsBatch } from "../models/transaction";

type Variables = {
  batchId: string;
};
type Response = HistoricalTransactionsBatch;

/**
 * Custom hook to fetch historical transactions batch information.
 *
 * @template Response - The type of the response data.
 * @template Variables - The type of the variables used in the query.
 * @template AxiosError - The type of the error that might be thrown by Axios.
 *
 * @returns {QueryObserverResult<Response, AxiosError>} The result of the query.
 *
 * @example
 * const { data, error, isLoading } = useHistoricalTransactionsBatchInfo({
 *   variables: { batchId: '12345' },
 * });
 *
 * @param {Variables} variables - The variables required to fetch the historical transactions batch info including `batchId`.
 * @param {string} variables.batchId - The ID of the batch to fetch information for.
 */
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
