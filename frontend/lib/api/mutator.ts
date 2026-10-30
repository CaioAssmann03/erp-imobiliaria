import type { AxiosRequestConfig } from "axios";

import { apiClient } from "./api-client";

// O `signal` vem do TanStack Query dentro de `config`: ao desmontar ou trocar a
// query (ex.: o usuário continua digitando na busca), a requisição é abortada.
export const customInstance = <T,>(config: AxiosRequestConfig): Promise<T> =>
  apiClient(config).then(({ data }) => data);

export default customInstance;
