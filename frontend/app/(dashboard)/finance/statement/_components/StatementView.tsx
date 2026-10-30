"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { ListState } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { useListParams } from "@/hooks/use-list-params";
import { useCurrentAccountEntriesList, useCurrentAccountsList } from "@/lib/api/generated";
import type { CurrentAccountEntriesListKind, CurrentAccountEntriesListParams } from "@/lib/api/generated/models";
import { addDays, brl, monthBounds, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

import { StatementRow } from "../../_components/StatementRow";

import { StatementBalances } from "./StatementBalances";
import { StatementFilters } from "./StatementFilters";


/** O período escolhido no menu, como datas da API. */
function periodParams(period: string, today: string): Pick<CurrentAccountEntriesListParams, "entry_date_after" | "entry_date_before"> {
  switch (period) {
    case "this_month": {
      const { from, to } = monthBounds(today);
      return { entry_date_after: from, entry_date_before: to };
    }
    case "last_month": {
      const { from, to } = monthBounds(today, -1);
      return { entry_date_after: from, entry_date_before: to };
    }
    case "last_30_days":
      return { entry_date_after: addDays(today, -30), entry_date_before: today };
    default:
      return {};
  }
}

/**
 * Client Component: o extrato de um condomínio, do mais recente ao mais antigo, num cartão só: o saldo atual em tipo grande (vermelho se negativo)
 * com o saldo de cada sub-conta, e os lançamentos com a busca e o filtro no padrão das listas de Unidades. As seções `saldo` e `lancamentos` são as do índice da direita.
 */
export function StatementView({ condominiumId }: { condominiumId: string }) {
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ filterKeys: ["kind", "period", "competence"] });

  const { data, isLoading, isPlaceholderData } = useCurrentAccountEntriesList(
    {
      ...params,
      condominium: condominiumId,
      ...periodParams(filters.period, todayIso()),
      ...(filters.kind ? { kind: filters.kind as CurrentAccountEntriesListKind } : {}),
      ...(filters.competence ? { competence_month: filters.competence } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: accounts, isLoading: loadingAccount } = useCurrentAccountsList({ condominium: condominiumId });
  const account = accounts?.results[0];
  const balance = Number(account?.balance ?? 0);
  const results = data?.results ?? [];

  return (
    <div className="rounded-card bg-surface p-5 sm:p-6">
      <section id="saldo" aria-label="Saldo da conta corrente" className="scroll-mt-20">
        <p className={cn("text-display tabular-nums", balance < 0 && "text-danger")}>{loadingAccount ? "–" : brl(balance)}</p>
        {account && (
          <div className="mt-5">
            <StatementBalances accountId={account.id} />
          </div>
        )}
      </section>

      <section id="lancamentos" aria-label="Lançamentos" className="mt-8 scroll-mt-20">
        <div className="mb-3">
          <StatementFilters search={search} onSearchChange={setSearch} filters={filters} onFilterChange={setFilter} onClear={clearFilters} />
        </div>

        <ListState
          isLoading={isLoading}
          isEmpty={results.length === 0}
          emptyTitle="Nenhum lançamento encontrado"
          emptyText="Os lançamentos aparecem aqui quando uma conta é paga ou um lançamento manual é feito."
        >
          <>
            <ul className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
              {results.map((entry) => (
                <StatementRow key={entry.id} entry={entry} />
              ))}
            </ul>
            <Pagination page={page} limit={limit} count={data?.count ?? 0} onPageChange={setPage} onLimitChange={setLimit} />
          </>
        </ListState>
      </section>
    </div>
  );
}
