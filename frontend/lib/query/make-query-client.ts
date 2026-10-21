import { isAxiosError } from "axios";
import { MutationCache, QueryClient } from "@tanstack/react-query";

import { getSearchRetrieveQueryKey } from "@/lib/api/generated";

/** Um erro 4xx (não encontrado, sem permissão, dados inválidos) não melhora tentando de novo; rede e 5xx podem. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response && error.response.status < 500) return false;
  return failureCount < 2;
}

const SEARCH_KEY = getSearchRetrieveQueryKey({ q: "" })[0];

export function makeQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    // Qualquer gravação pode mudar o que a busca global acha: as buscas em cache (por termo) ficam velhas.
    mutationCache: new MutationCache({
      onSuccess: () => {
        void queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey[0] === SEARCH_KEY });
      },
    }),
    defaultOptions: {
      queries: {
        // Dados hidratados do servidor não são refeitos imediatamente no cliente.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
    },
  });
  return queryClient;
}
