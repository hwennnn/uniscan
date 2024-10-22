import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { Summary } from "../models/transaction";

type Variables = object;
type Response = Summary;

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
