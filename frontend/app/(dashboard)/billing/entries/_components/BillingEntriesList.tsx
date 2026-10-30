"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider, ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingEntriesList, useCondominiumsList } from "@/lib/api/generated";
import { buildGrid, formatCode } from "@/lib/billing/billing-entry-payload";
import { MAX_ENTRIES_PER_MONTH, billingEntriesUrl, newBillingEntryUrl } from "@/lib/billing/billing-entry-workspace";
import { todayIso } from "@/lib/format/format";
import { cn } from "@/lib/utils";

import { BillingEntryListItem } from "./BillingEntryListItem";
import { useEntriesScope } from "./use-entries-scope";

/**
 * Client Component: a coluna da esquerda da inclusão de valores, no padrão da lista de condomínios: título com **+** de novo lançamento, o condomínio e o
 * mês como escopo (seletores; ficam na URL, então a grade e o detalhe os seguem), a busca pelo nome do boleto ou pela sub-conta e os lançamentos do mês,
 * 10 de cada vez, com o aberto marcado e o total de cada um. Um condomínio tem poucos lançamentos por mês, então a busca é no cliente.
 */
export function BillingEntriesList({ openEntryId, className }: { openEntryId: string | null; className?: string }) {
  const router = useRouter();
  const scope = useEntriesScope();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${scope.month}|${term}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data, isLoading, isPlaceholderData } = useBillingEntriesList(
    { condominium: scope.condominium, reference_month: scope.month, limit: MAX_ENTRIES_PER_MONTH, ...(term ? { query: term } : {}) },
    { query: { enabled: scope.condominium !== "", placeholderData: keepPreviousData } }
  );
  const entries = data?.results ?? [];
  const { entryTotals } = buildGrid(entries.map((entry) => ({ id: entry.id, month: entry.month })));

  const hasScope = scope.condominium !== "";
  const plusClass = "flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors";

  return (
    <aside
      aria-label="Inclusão de valores"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Inclusão de valores</h2>
        {hasScope ? (
          <Link
            href={newBillingEntryUrl(scope)}
            aria-label="Novo lançamento"
            title="Novo lançamento"
            className={cn(plusClass, "hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring")}
          >
            <Plus className="size-5" />
          </Link>
        ) : (
          <span aria-disabled="true" title="Escolha o condomínio para incluir um valor" className={cn(plusClass, "cursor-not-allowed opacity-40")}>
            <Plus className="size-5" />
          </span>
        )}
      </div>

      <ScopeSearchCard
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={scope.condominium}
              placeholder="Selecione o condomínio"
              onChange={(condominium) => router.push(billingEntriesUrl({ ...scope, condominium }))}
              options={(condominiums?.results ?? []).map((item) => ({
                value: item.id,
                label: `${formatCode(item.code)} · ${item.name}`,
                title: item.name,
              }))}
            />
            <ScopeDivider />
            <MonthSelect
              className="w-28"
              label="Mês de referência"
              value={scope.month}
              today={todayIso()}
              onChange={(month) => router.push(billingEntriesUrl({ ...scope, month }))}
            />
          </>
        }
      >
        {hasScope && (
          <ScopeSearchRow>
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              aria-label="Buscar lançamento pelo nome ou pela sub-conta"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome ou sub-conta"
              className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
            />
          </ScopeSearchRow>
        )}
      </ScopeSearchCard>

      <nav aria-label="Lista de lançamentos" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {!hasScope ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha o condomínio para ver os valores do mês.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{term ? "Nenhum lançamento com essa busca." : "Nenhum lançamento neste mês."}</p>
        ) : (
          <ul className="space-y-0.5">
            {entries.slice(0, limit).map((entry) => (
              <BillingEntryListItem
                key={entry.id}
                entry={entry}
                total={entryTotals[entry.id] ?? "0.00"}
                scope={scope}
                isOpen={entry.id === openEntryId}
                dimmed={Boolean(openEntryId)}
              />
            ))}
          </ul>
        )}
      </nav>

      {hasScope && data && <ShowMore shown={Math.min(limit, entries.length)} total={entries.length} noun="lançamento(s)" onMore={showMore} />}
    </aside>
  );
}
