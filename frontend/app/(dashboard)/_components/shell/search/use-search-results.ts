"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearchRetrieve } from "@/lib/api/generated";
import type { Search } from "@/lib/api/generated/models";
import { isSearchable, searchStatic } from "@/lib/search-index";

import type { SearchResultItem } from "./types";

const DEBOUNCE_MS = 250;

function apiResults(data: Search): SearchResultItem[] {
  return [
    ...data.persons.map((person) => ({
      key: `p${person.id}`,
      group: "Pessoas",
      title: person.name,
      subtitle: person.document,
      href: `/persons/${person.id}`,
    })),
    ...data.condominiums.map((condominium) => ({
      key: `c${condominium.id}`,
      group: "Condomínios",
      title: condominium.name,
      subtitle: condominium.city ? `${condominium.city}/${condominium.state}` : (condominium.cnpj ?? undefined),
      href: `/condominiums/${condominium.id}`,
    })),
    ...data.units.map((unit) => ({
      key: `u${unit.id}`,
      group: "Unidades",
      title: `Unidade ${unit.name}`,
      subtitle: unit.condominium_name,
      href: `/condominiums/${unit.condominium}/units/${unit.id}`,
    })),
  ];
}

/**
 * Resultados da busca global: cadastros da API (TanStack Query, com debounce e cache por termo)
 * mais páginas e gráficos do painel, filtrados no navegador sem esperar o debounce.
 */
export function useSearchResults(query: string) {
  const trimmed = query.trim();
  const term = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = isSearchable(term);

  const { data, isFetching } = useSearchRetrieve(
    { q: term },
    { query: { enabled, placeholderData: keepPreviousData, staleTime: 30_000 } }
  );

  const items = useMemo<SearchResultItem[]>(() => {
    const fromApi = enabled && data ? apiResults(data) : [];
    const pages = searchStatic(query).map((item) => ({
      key: item.href,
      group: "Páginas e gráficos",
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
    }));
    return [...fromApi, ...pages];
  }, [data, enabled, query]);

  return {
    items,
    searchable: isSearchable(query),
    waiting: isSearchable(query) && (isFetching || trimmed !== term),
  };
}
