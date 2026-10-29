"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter, FilterSummary } from "@/components/CompactFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBlocksList, useCondominiumsList, useUnitsList } from "@/lib/api/generated";
import type { UnitsListType } from "@/lib/api/generated/models";
import { newUnitUrl, UNIT_LIST_PAGE_SIZE, unitsUrl } from "@/lib/unit-workspace";
import { cn } from "@/lib/utils";

import { UnitListItem } from "./UnitListItem";
import { NO_UNIT_FILTERS, unitFilterGroups, type UnitFilters } from "./unit-filter-groups";

/**
 * Client Component: a coluna da esquerda do cadastro de unidades. No alto, o condomínio (código e nome); embaixo, as unidades
 * dele, com busca no servidor, **+** de nova unidade e filtros discretos (`CompactFilter`: bloco, tipo, situação). Sem condomínio
 * escolhido, só pede para escolher. `?block=` na URL (de "Ver unidades" num bloco) já abre filtrada.
 */
export function UnitsList({
  condominiumId,
  openUnitId,
  className,
}: {
  condominiumId: string | null;
  openUnitId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const initialBlock = useSearchParams().get("block") ?? "";
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UnitFilters>({ ...NO_UNIT_FILTERS, block: initialBlock });
  const term = useDebouncedValue(search.trim());

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: blocksData } = useBlocksList(
    { condominium: condominiumId ?? undefined, limit: 100 },
    { query: { enabled: Boolean(condominiumId) } }
  );
  const blocks = blocksData?.results ?? [];
  const blockName = (id: string | null | undefined) => blocks.find((block) => block.id === id)?.name ?? null;

  const { data, isLoading, isPlaceholderData } = useUnitsList(
    {
      condominium: condominiumId ?? undefined,
      limit: UNIT_LIST_PAGE_SIZE,
      ...(term ? { query: term } : {}),
      ...(filters.block ? { block: filters.block } : {}),
      ...(filters.type ? { type: filters.type as UnitsListType } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
    },
    { query: { enabled: Boolean(condominiumId), placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term);
  const filterGroups = unitFilterGroups(blocks, filters, (key, value) => setFilters((current) => ({ ...current, [key]: value })));
  const clearFilters = () => setFilters(NO_UNIT_FILTERS);

  const chooseCondominium = (id: string) => {
    clearFilters();
    setSearch("");
    router.push(unitsUrl(id || undefined));
  };

  return (
    <aside
      aria-label="Unidades"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-80",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Unidades</h2>
        {condominiumId ? (
          <Link
            href={newUnitUrl(condominiumId)}
            aria-label="Nova unidade"
            title="Nova unidade"
            className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
          </Link>
        ) : (
          <span aria-disabled="true" className="flex size-8 cursor-not-allowed items-center justify-center text-ink-soft opacity-40">
            <Plus className="size-5" />
          </span>
        )}
      </div>

      <label className="block">
        <span className="sr-only">Condomínio</span>
        <select
          value={condominiumId ?? ""}
          onChange={(event) => chooseCondominium(event.target.value)}
          className="h-10 w-full rounded-control bg-surface px-3 text-body shadow-card outline-none focus:ring-2 focus:ring-brand/50"
        >
          <option value="">Selecione o condomínio</option>
          {(condominiums?.results ?? []).map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {String(condominium.code).padStart(4, "0")} · {condominium.name}
            </option>
          ))}
        </select>
      </label>

      {condominiumId && (
        <>
          <div className="flex h-10 items-center gap-2 rounded-control bg-surface pr-1.5 pl-3 text-ink-soft shadow-card focus-within:ring-2 focus-within:ring-brand/50">
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              aria-label="Buscar unidade"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar unidade"
              className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
            />
            <CompactFilter groups={filterGroups} onClear={clearFilters} />
          </div>
          <FilterSummary groups={filterGroups} onClear={clearFilters} />
        </>
      )}

      <nav
        aria-label="Lista de unidades"
        className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}
      >
        {!condominiumId ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha um condomínio para ver as unidades dele.</p>
        ) : isLoading ? (
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
              <UnitListItem
                key={unit.id}
                unit={unit}
                blockName={blockName(unit.block)}
                isOpen={unit.id === openUnitId}
                dimmed={Boolean(openUnitId)}
              />
            ))}
          </ul>
        )}
      </nav>

      {data && (
        <p className="px-1 text-center text-caption text-ink-soft">
          {data.count > results.length
            ? `${results.length} de ${data.count}: refine a busca`
            : `${data.count} unidade(s)`}
        </p>
      )}
    </aside>
  );
}
