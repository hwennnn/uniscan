import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { EthPrice } from "../models/transaction";

type Variables = object;
type Response = EthPrice;

/**
 * Custom hook to fetch the latest Ethereum price using a query.
 *
 * @function useLatestEthPriceQuery
 *
 * @description
 * This hook utilizes `createQuery` to fetch the latest Ethereum price from the API endpoint `v1/eth-price`.
 * It sets a query key of `["eth-price"]` and refetches the data every 1000 milliseconds (1 second).
 *
 * @template Response - The expected response type from the API.
 * @template Variables - The variables type for the query. (None required for this query)
 * @template AxiosError - The error type in case the API call fails.
 *
 * @returns {Promise<Response>} The latest Ethereum price data.
 *
 * @throws {AxiosError} If the API call fails, the error is caught and rejected.
 */
export const useLatestEthPriceQuery = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["eth-price"],
  fetcher: async () => {
    const response = await client
      .get<Response>(`v1/eth-price`)
      .catch((error) => {
        return Promise.reject(error);
      });
    return response.data;
  },
  refetchInterval: 1000, // Refetch the data every 1000 milliseconds (1 second).
});
