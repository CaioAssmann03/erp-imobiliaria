import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dados hidratados do servidor não são refeitos imediatamente no cliente.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
