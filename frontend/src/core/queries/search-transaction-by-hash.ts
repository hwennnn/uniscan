import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import client from "../common/client";
import { QueryTransaction } from "../models/transaction";

type Variables = {
  hash: string;
};
type Response = QueryTransaction | null;

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
