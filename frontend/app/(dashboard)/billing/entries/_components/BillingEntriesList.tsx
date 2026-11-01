"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider, ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingEntriesList } from "@/lib/api/generated";
import { buildGrid } from "@/lib/billing/billing-entry-payload";
import { MAX_ENTRIES_PER_MONTH, billingEntriesUrl, newBillingEntryUrl } from "@/lib/billing/billing-entry-workspace";
import { todayIso } from "@/lib/format/format";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

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
  const { data, isLoading, isPlaceholderData } = useBillingEntriesList(
    { condominium: scope.condominium, reference_month: scope.month, limit: MAX_ENTRIES_PER_MONTH, ...(term ? { query: term } : {}) },
    { query: { enabled: scope.condominium !== "", placeholderData: keepPreviousData } }
  );
  const entries = data?.results ?? [];
  const { entryTotals } = buildGrid(entries.map((entry) => ({ id: entry.id, month: entry.month })));

  const hasScope = scope.condominium !== "";

  return (
    <RegistryList
      label="Inclusão de valores"
      title="Inclusão de valores"
      actions={
        <RegistryCreate
          href={newBillingEntryUrl(scope)}
          label="Novo lançamento"
          disabledHint={hasScope ? undefined : "Escolha o condomínio para incluir um valor"}
        />
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <>
              <CondominiumScopeSelect value={scope.condominium} onChange={(condominium) => router.push(billingEntriesUrl({ ...scope, condominium }))} />
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
          {hasScope && <RegistrySearch label="Buscar lançamento pelo nome ou pela sub-conta" placeholder="Nome ou sub-conta" value={search} onChange={setSearch} />}
        </ScopeSearchCard>
      }
      navLabel="Lista de lançamentos"
      blocked={hasScope ? null : "Escolha o condomínio para ver os valores do mês."}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={entries.length === 0}
      emptyMessage={term ? "Nenhum lançamento com essa busca." : "Nenhum lançamento neste mês."}
      footer={hasScope && data && <ShowMore shown={Math.min(limit, entries.length)} total={entries.length} noun="lançamento(s)" onMore={showMore} />}
      className={className}
    >
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
    </RegistryList>
  );
}
