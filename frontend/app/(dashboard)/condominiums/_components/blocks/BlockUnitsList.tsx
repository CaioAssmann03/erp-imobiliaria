"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useUnitsList } from "@/lib/api/generated";
import { cn } from "@/lib/utils";

import { UnitListItem } from "../[id]/units/_components/UnitListItem";

/**
 * Client Component: as unidades do bloco aberto, numa sub-tela no meio (como as pessoas da unidade), no padrão visual das outras listas do
 * condomínio: cartão branco, busca em pílula (no servidor), linhas simples, 10 de cada vez. Abrir uma unidade leva ao módulo de unidades, e o
 * "voltar" dela retorna a esta tela (`?from=`).
 */
export function BlockUnitsList({ blockId }: { blockId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${blockId}`);
  const { data, isLoading, isPlaceholderData } = useUnitsList(
    { block: blockId, limit, ...(term ? { query: term } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

  return (
    <section aria-label="Unidades do bloco" className="flex flex-col gap-3">
      <h2 className="px-1 text-heading">Unidades</h2>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card">
        <label className="flex h-10 items-center gap-2 rounded-control bg-surface-muted px-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Buscar unidade</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou número da unidade"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </label>

        <nav aria-label="Lista de unidades do bloco" className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {term ? "Nenhuma unidade com essa busca." : "Este bloco ainda não tem unidades."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((unit) => (
                <UnitListItem key={unit.id} unit={unit} blockName={null} onCard context={{ block: blockId, from: here }} />
              ))}
            </ul>
          )}
        </nav>

        {data && <ShowMore shown={results.length} total={data.count} noun="unidade(s)" onMore={showMore} />}
      </div>
    </section>
  );
}
