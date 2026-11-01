"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { RegistryCreate } from "@/components/layout/RegistryList";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBlocksList } from "@/lib/api/generated";
import { newBlockUrl } from "@/lib/condominiums/block-workspace";

import { BlockListItem } from "./BlockListItem";

/**
 * Client Component: os blocos de um condomínio no padrão visual da lista de condomínios (título com **+**, busca em pílula, linhas simples
 * num cartão branco). A busca pelo nome e a paginação são da API.
 * Abrir um bloco leva à edição dele.
 */
export function BlocksRegistryList({ condominiumId }: { condominiumId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${condominiumId}`);
  const { data, isLoading } = useBlocksList({ condominium: condominiumId, limit, ...(term ? { query: term } : {}) });
  const results = data?.results ?? [];

  return (
    <section aria-label="Blocos" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Blocos</h2>
        <RegistryCreate href={newBlockUrl(condominiumId)} label="Novo bloco" />
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card">
        <label className="flex h-10 items-center gap-2 rounded-control bg-surface-muted px-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Buscar bloco</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome do bloco"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </label>

        <nav aria-label="Lista de blocos">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-11 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {term ? "Nenhum bloco com esse nome." : "Este condomínio ainda não tem blocos."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((block) => (
                <BlockListItem key={block.id} block={block} onCard withUnitsLink from={here} />
              ))}
            </ul>
          )}
        </nav>

        {data && <ShowMore shown={results.length} total={data.count} noun="bloco(s)" onMore={showMore} />}
      </div>
    </section>
  );
}
