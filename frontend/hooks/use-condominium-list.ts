"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCondominiumsListInfinite } from "@/lib/api/generated";
import type { CondominiumsListOrdering, CondominiumsListPending, CondominiumsListParams } from "@/lib/api/generated/models";
import { pendingFromParam } from "@/lib/condominium-list";

/** Quantos condomínios cada carga traz; o painel pede mais ao rolar até o fim (spec 038). */
const PAGE_SIZE = 50;

/**
 * Estado do painel de condomínios (busca, ordem, filtros, "ocultar inativos") e a consulta que o alimenta, carregada
 * por páginas. Os inativos ficam ocultos de início; a ordem inicial é pelo código, como na Sami. A pendência vem do
 * endereço quando se chega pelos atalhos do início (`/condominiums?pending=…`).
 */
export function useCondominiumList() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [hidesInactive, setHidesInactive] = useState(true);
  const [ordering, setOrdering] = useState<CondominiumsListOrdering>("code");
  const [type, setType] = useState("");
  const [pending, setPending] = useState(() => pendingFromParam(searchParams.get("pending")));
  const term = useDebouncedValue(search.trim());

  const params: CondominiumsListParams = {
    limit: PAGE_SIZE,
    ordering,
    ...(term ? { query: term } : {}),
    ...(hidesInactive ? { active: true } : {}),
    ...(type ? { type: type as "residential" | "commercial" } : {}),
    ...(pending ? { pending: pending as CondominiumsListPending } : {}),
  };

  const query = useCondominiumsListInfinite(params, {
    query: {
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => (lastPage.next ? pages.length + 1 : undefined),
      placeholderData: keepPreviousData,
    },
  });

  const rows = query.data?.pages.flatMap((page) => page.results) ?? [];
  const total = query.data?.pages[0]?.count;

  const clearFilters = () => {
    setType("");
    setPending("");
  };

  return {
    search,
    setSearch,
    hidesInactive,
    setHidesInactive,
    ordering,
    setOrdering,
    type,
    setType,
    pending,
    setPending,
    clearFilters,
    rows,
    total,
    query,
  };
}

export type CondominiumListState = ReturnType<typeof useCondominiumList>;
