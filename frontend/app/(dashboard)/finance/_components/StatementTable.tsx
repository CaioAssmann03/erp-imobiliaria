"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ListState, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import { useCondominiumsList, useCurrentAccountEntriesList, useCurrentAccountsList } from "@/lib/api/generated";
import type { CurrentAccountEntriesListKind, CurrentAccountEntriesListParams } from "@/lib/api/generated/models";
import { addDays, brl, monthBounds, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  const balanceText = condominium ? (
    <span className={cn("tabular-nums", balance < 0 && "text-danger")}>Saldo {brl(balance)}</span>
  ) : undefined;

  return (
    <>
      <Toolbar right={condominium ? balanceText : undefined}>
        <StatementFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          condominium={condominium ?? ""}
          onCondominiumChange={(value) =>
            router.push(value ? `/finance/statement?condominium=${value}` : "/finance/statement")
          }
          condominiums={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      </Toolbar>
      {condominium && <p className="mb-2 px-1 text-body text-ink-soft sm:hidden">{balanceText}</p>}
      {account && <StatementBalances accountId={account.id} />}

      <ListState
        isLoading={Boolean(condominium) && isLoading}
        isEmpty={!condominium || results.length === 0}
        emptyTitle={condominium ? "Nenhum lançamento encontrado" : "Escolha um condomínio"}
        emptyText={
          condominium
            ? "Os lançamentos aparecem aqui quando uma conta é paga ou um lançamento manual é feito."
            : "Use o filtro de condomínio para ver o saldo e os lançamentos da conta corrente dele."
        }
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Nº</TableHead>
                  <TableHead className="hidden md:table-cell">Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Sub-conta</TableHead>
                  <TableHead className="hidden md:table-cell">Unidade</TableHead>
                  <TableHead className="hidden md:table-cell">Competência</TableHead>
                  <TableHead className="hidden md:table-cell">Lote</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((entry) => (
                  <StatementRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} limit={limit} count={data?.count ?? 0} onPageChange={setPage} onLimitChange={setLimit} />
        </>
      </ListState>
    </>
  );
}
