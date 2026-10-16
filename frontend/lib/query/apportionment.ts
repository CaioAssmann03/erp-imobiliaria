import type { QueryClient } from "@tanstack/react-query";

/**
 * Os totais das frações de um condomínio mudam quando uma unidade é criada, alterada ou excluída:
 * a chave do cartão leva o id do condomínio, então se invalidam todas pelo fim do caminho.
 */
export const invalidateApportionment = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === "string" && queryKey[0].endsWith("/apportionment/"),
  });
