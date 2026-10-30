"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList, useCurrentAccountsList } from "@/lib/api/generated";
import { cn } from "@/lib/utils";

import { StatementListItem } from "./StatementListItem";

/**
 * Client Component: a coluna da esquerda do extrato, no padrão da lista de condomínios: o título, a busca no servidor (código ou nome) e os
 * condomínios por código, 10 de cada vez, cada um com o saldo da conta corrente, e o aberto marcado. Não há **+**: o extrato não se cadastra.
 */
export function StatementList({ openCondominiumId, className }: { openCondominiumId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(term);
  const { data, isLoading, isPlaceholderData } = useCondominiumsList(
    { limit, ...(term ? { query: term } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: accounts } = useCurrentAccountsList({ limit: 100 });
  const balances = new Map((accounts?.results ?? []).map((account) => [account.condominium, Number(account.balance)]));
  const results = data?.results ?? [];

  return (
    <aside
      aria-label="Extrato"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="px-1">
        <h2 className="text-heading">Extrato</h2>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-control bg-surface px-3 text-ink-soft shadow-card focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          aria-label="Buscar condomínio por código ou nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Código ou nome"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      <nav aria-label="Lista de condomínios" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{term ? "Nenhum condomínio com essa busca." : "Nenhum condomínio cadastrado ainda."}</p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((condominium) => (
              <StatementListItem
                key={condominium.id}
                condominium={condominium}
                balance={balances.get(condominium.id) ?? null}
                isOpen={condominium.id === openCondominiumId}
                dimmed={Boolean(openCondominiumId)}
              />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="condomínio(s)" onMore={showMore} />}
    </aside>
  );
}
