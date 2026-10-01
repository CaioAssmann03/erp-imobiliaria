import type { AxiosRequestConfig } from "axios";

import { apiClient } from "../api-client";

export const customInstance = <T,>(config: AxiosRequestConfig): Promise<T> => {
  const controller = new AbortController();
  const promise = apiClient({ ...config, signal: controller.signal }).then(
    ({ data }) => data
  );

  // @ts-expect-error — orval's react-query integration calls .cancel() on the returned promise
  promise.cancel = () => controller.abort();

  return promise;
};

export default customInstance;
