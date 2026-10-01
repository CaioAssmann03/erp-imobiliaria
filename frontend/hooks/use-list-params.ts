import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

/**
 * Estado de uma listagem paginada com busca: página, itens por página e termo.
 * `params` sempre leva `limit` (o servidor faz o prefetch com o mesmo `limit` padrão,
 * então a primeira carga usa a mesma chave de cache e vem hidratada).
 */
export function useListParams({ searchable = true }: { searchable?: boolean } = {}) {
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(DEFAULT_PAGE_SIZE);
  const term = useDebouncedValue(search.trim());

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setLimit = (value: number) => {
    setLimitState(value);
    setPage(1);
  };

  const params = {
    ...(searchable && term ? { query: term } : {}),
    ...(page > 1 ? { page } : {}),
    limit,
  };

  return { search, setSearch, page, setPage, limit, setLimit, params };
}
