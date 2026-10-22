"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ListState, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { useListParams } from "@/hooks/use-list-params";
import { useCondominiumsList, useCurrentAccountEntriesList, useCurrentAccountsList } from "@/lib/api/generated";
import type { CurrentAccountEntriesListKind, CurrentAccountEntriesListParams } from "@/lib/api/generated/models";
import { addDays, brl, monthBounds, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CondominiumPicker } from "./CondominiumPicker";
import { StatementBalances } from "./StatementBalances";
import { StatementFilters } from "./StatementFilters";
import { StatementRow } from "./StatementRow";

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

/** Client Component: o extrato de um condomínio (na URL: `?condominium=`), do mais recente ao mais antigo. */
export function StatementTable({ condominium }: { condominium?: string }) {
  const router = useRouter();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ filterKeys: ["kind", "period", "competence"] });

  const { data, isLoading, isPlaceholderData } = useCurrentAccountEntriesList(
    {
      ...params,
      condominium,
      ...periodParams(filters.period, todayIso()),
      ...(filters.kind ? { kind: filters.kind as CurrentAccountEntriesListKind } : {}),
      ...(filters.competence ? { competence_month: filters.competence } : {}),
    },
    { query: { enabled: Boolean(condominium), placeholderData: keepPreviousData } }
  );
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: accounts } = useCurrentAccountsList({ condominium }, { query: { enabled: Boolean(condominium) } });
  const account = accounts?.results[0];
  const balance = Number(account?.balance ?? 0);
  const results = data?.results ?? [];

  const condominiumOptions = (condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }));
  const chooseCondominium = (value: string) =>
    router.push(value ? `/finance/statement?condominium=${value}` : "/finance/statement");
  // Com um único condomínio não há o que escolher: já abre o extrato dele.
  const onlyCondominium = condominiumOptions.length === 1 ? condominiumOptions[0].value : "";
  useEffect(() => {
    if (!condominium && onlyCondominium) router.replace(`/finance/statement?condominium=${onlyCondominium}`);
  }, [condominium, onlyCondominium, router]);

  return (
    <>
      <section aria-label="Resumo da conta corrente" className="mb-4 rounded-card bg-card p-4 shadow-card sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
          <div>
            <p className="mb-1.5 text-caption text-ink-soft">Condomínio</p>
            <CondominiumPicker value={condominium ?? ""} onChange={chooseCondominium} options={condominiumOptions} />
          </div>
          {condominium && (
            <div>
              <p className="mb-1.5 text-caption text-ink-soft">Saldo atual</p>
              <p className={cn("flex items-center text-title tabular-nums sm:h-11", balance < 0 && "text-danger")}>
                {brl(balance)}
              </p>
            </div>
          )}
        </div>
        {account && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-caption text-ink-soft">Por sub-conta</p>
            <StatementBalances accountId={account.id} />
          </div>
        )}
      </section>

      <Toolbar>
        <StatementFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={setFilter}
          onClear={clearFilters}
        />
      </Toolbar>

      <ListState
        isLoading={Boolean(condominium) && isLoading}
        isEmpty={!condominium || results.length === 0}
        emptyTitle={condominium ? "Nenhum lançamento encontrado" : "Escolha um condomínio"}
        emptyText={
          condominium
            ? "Os lançamentos aparecem aqui quando uma conta é paga ou um lançamento manual é feito."
            : "Use o seletor de condomínio acima para ver o saldo e os lançamentos da conta corrente dele."
        }
      >
        <>
          <ul
            className={cn(
              "rounded-card bg-card shadow-card transition-opacity",
              isPlaceholderData && "opacity-60"
            )}
          >
            {results.map((entry) => (
              <StatementRow key={entry.id} entry={entry} />
            ))}
          </ul>
          <Pagination page={page} limit={limit} count={data?.count ?? 0} onPageChange={setPage} onLimitChange={setLimit} />
        </>
      </ListState>
    </>
  );
}
