import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { EthPrice } from "../models/transaction";

type Variables = object;
type Response = EthPrice;

export const useLatestEthPriceQuery = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["eth-price"],
  fetcher: async () => {
    const response = await client.get(`v1/eth-price`).catch((error) => {
      return Promise.reject(error);
    });
    return response.data;
  },
  refetchInterval: 1000,
});
