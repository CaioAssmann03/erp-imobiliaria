"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CompactFilter } from "@/components/CompactFilter";
import type { FilterGroup } from "@/components/FilterMenu";
import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCostCentersList } from "@/lib/api/generated";
import { newCostCenterUrl } from "@/lib/cost-center-workspace";
import { cn } from "@/lib/utils";

import { CostCenterListItem } from "./CostCenterListItem";

/**
 * Client Component: as sub-contas de um condomínio no padrão visual da lista de condomínios (título com **+**, busca em pílula com o filtro
 * discreto dentro, linhas simples num cartão branco, a situação em texto verde ou preto). Carrega as primeiras ao abrir; busca por nome e
 * filtro de situação são no servidor. Abrir uma sub-conta leva à edição dela.
 */
export function CostCentersRegistryList({ condominiumId }: { condominiumId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${status}`);
  const { data, isLoading, isPlaceholderData } = useCostCentersList(
    {
      condominium: condominiumId,
      limit,
      ...(term ? { query: term } : {}),
      ...(status ? { active: status === "active" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: status,
      onChange: setStatus,
      options: [
        { value: "active", label: "Ativas" },
        { value: "inactive", label: "Inativas" },
      ],
    },
  ];

  return (
    <section aria-label="Sub-contas" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Sub-contas</h2>
        <Link
          href={newCostCenterUrl(condominiumId)}
          aria-label="Nova sub-conta"
          title="Nova sub-conta"
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
            aria-label="Buscar sub-conta"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código ou nome"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          <CompactFilter groups={groups} onClear={() => setStatus("")} />
        </div>

        <nav aria-label="Lista de sub-contas" className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-11 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {term || status ? "Nenhuma sub-conta com esses filtros." : "Este condomínio ainda não tem sub-contas."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((costCenter) => (
                <CostCenterListItem key={costCenter.id} costCenter={costCenter} onCard withStatus from={here} />
              ))}
            </ul>
          )}
        </nav>

        {data && <ShowMore shown={results.length} total={data.count} noun="sub-conta(s)" onMore={showMore} />}
      </div>
    </section>
  );
}
