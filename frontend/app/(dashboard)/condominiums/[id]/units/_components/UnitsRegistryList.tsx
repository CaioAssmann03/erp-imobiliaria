"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter, FilterSummary } from "@/components/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBlocksList, useUnitsList } from "@/lib/api/generated";
import type { UnitsListPending, UnitsListType } from "@/lib/api/generated/models";
import { newUnitUrl } from "@/lib/unit-workspace";
import { cn } from "@/lib/utils";

import { UnitListItem } from "./UnitListItem";
import { NO_UNIT_FILTERS, unitFilterGroups, type UnitFilters } from "./unit-filter-groups";

/**
 * Client Component: as unidades de um condomínio no padrão visual da lista de condomínios (título com **+**, busca em pílula,
 * linhas simples). Carrega as primeiras ao abrir; busca e filtros (`CompactFilter`: bloco, tipo, situação) são no servidor. O bloco e a
 * pendência já aplicados ao abrir vêm da URL (`?block=`, `?pending=`: de "Ver unidades" nas outras listas). Abrir uma unidade leva ao cadastro dela.
 */
export function UnitsRegistryList({ condominiumId }: { condominiumId: string }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UnitFilters>({
    ...NO_UNIT_FILTERS,
    block: searchParams.get("block") ?? "",
    pending: searchParams.get("pending") ?? "",
  });
  const term = useDebouncedValue(search.trim());
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term);

  const { data: blocksData } = useBlocksList({ condominium: condominiumId, limit: 100 });
  const blocks = blocksData?.results ?? [];
  const blockName = (id: string | null | undefined) => blocks.find((block) => block.id === id)?.name ?? null;

  const { limit, showMore } = useGrowingLimit(`${term}|${filters.block}|${filters.type}|${filters.status}|${filters.pending}`);
  const { data, isLoading, isPlaceholderData } = useUnitsList(
    {
      condominium: condominiumId,
      limit,
      ...(term ? { query: term } : {}),
      ...(filters.block ? { block: filters.block } : {}),
      ...(filters.type ? { type: filters.type as UnitsListType } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.pending ? { pending: filters.pending as UnitsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const filterGroups = unitFilterGroups(blocks, filters, (key, value) => setFilters((current) => ({ ...current, [key]: value })));
  const clearFilters = () => setFilters(NO_UNIT_FILTERS);

  return (
    <section aria-label="Unidades" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Unidades</h2>
        <Link
          href={newUnitUrl(condominiumId)}
          aria-label="Nova unidade"
          title="Nova unidade"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card">
        <div className="flex h-10 items-center gap-2 rounded-control bg-surface-muted pr-1.5 pl-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar unidade"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou número da unidade"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          <CompactFilter groups={filterGroups} onClear={clearFilters} />
        </div>
        <FilterSummary groups={filterGroups} onClear={clearFilters} />

        <nav aria-label="Lista de unidades" className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {hasFilters ? "Nenhuma unidade com esses filtros." : "Este condomínio ainda não tem unidades."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((unit) => (
                <UnitListItem key={unit.id} unit={unit} blockName={blockName(unit.block)} onCard />
              ))}
            </ul>
          )}
        </nav>

        {data && <ShowMore shown={results.length} total={data.count} noun="unidade(s)" onMore={showMore} />}
      </div>
    </section>
  );
}
