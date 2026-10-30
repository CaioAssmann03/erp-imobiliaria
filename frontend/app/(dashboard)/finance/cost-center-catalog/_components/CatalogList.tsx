"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCostCenterCatalogList } from "@/lib/api/generated";
import { newCatalogItemUrl } from "@/lib/finance/cost-center-catalog-workspace";
import { cn } from "@/lib/utils";

import { CatalogListItem } from "./CatalogListItem";

/**
 * Client Component: a coluna da esquerda do catálogo de sub-contas, no padrão da lista de condomínios: título com **+** de nova sub-conta, busca
 * no servidor (código ou nome) com o filtro discreto dentro (`CompactFilter`: situação) e as sub-contas por código, 10 de cada vez, com a aberta marcada.
 */
export function CatalogList({ openItemId, className }: { openItemId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${status}`);
  const { data, isLoading, isPlaceholderData } = useCostCenterCatalogList(
    { limit, ...(term ? { query: term } : {}), ...(status ? { active: status === "active" } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

  const groups: CompactFilterGroup[] = [
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
    <aside
      aria-label="Catálogo de sub-contas"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Sub-contas</h2>
        <Link
          href={newCatalogItemUrl()}
          aria-label="Nova sub-conta"
          title="Nova sub-conta"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-control bg-surface pr-1.5 pl-3 text-ink-soft shadow-card focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          aria-label="Buscar sub-conta por código ou nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Código ou nome"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
        <CompactFilter groups={groups} onClear={() => setStatus("")} />
      </div>

      <nav aria-label="Lista de sub-contas" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {term || status ? "Nenhuma sub-conta com esses filtros." : "Nenhuma sub-conta no catálogo ainda."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((item) => (
              <CatalogListItem key={item.id} item={item} isOpen={item.id === openItemId} dimmed={Boolean(openItemId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="sub-conta(s)" onMore={showMore} />}
    </aside>
  );
}
