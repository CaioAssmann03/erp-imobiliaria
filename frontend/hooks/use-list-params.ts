import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/pagination";

/**
 * Estado de uma listagem paginada com busca: página, itens por página e termo.
 * `params` sempre leva `limit` (o servidor faz o prefetch com o mesmo `limit` padrão,
 * então a primeira carga usa a mesma chave de cache e vem hidratada).
 */
export function useListParams<F extends string = never>({
  searchable = true,
  filterKeys = [] as readonly F[],
  initialFilters,
}: { searchable?: boolean; filterKeys?: readonly F[]; initialFilters?: Partial<Record<F, string>> } = {}) {
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(DEFAULT_PAGE_SIZE);
  const term = useDebouncedValue(search.trim());

  // Filtros por campo (valor "" = sem filtro). O chamador converte para os params da API.
  const emptyFilters = Object.fromEntries(filterKeys.map((key) => [key, ""])) as Record<F, string>;
  const [filters, setFilters] = useState<Record<F, string>>({ ...emptyFilters, ...initialFilters });
  const hasFilters = Object.values(filters).some(Boolean);

  const setFilter = (key: F, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

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

  return {
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    params,
    filters,
    setFilter,
    clearFilters,
    hasFilters,
  };
}
