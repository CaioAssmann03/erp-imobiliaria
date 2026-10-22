"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ListState, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getAccountsPayableListQueryKey,
  getDashboardRetrieveQueryKey,
  useAccountsPayableCancel,
  useAccountsPayableList,
  useCondominiumsList,
} from "@/lib/api/generated";
import type { AccountsPayableListParams, AccountsPayableListStatus } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { addDays, monthBounds, todayIso } from "@/lib/format";

import { AccountPayableRow } from "./AccountPayableRow";
import { AccountsPayableFilters } from "./AccountsPayableFilters";

/** O período de vencimento escolhido no menu, como parâmetros da API. */
function dueParams(due: string, today: string): Pick<AccountsPayableListParams, "due_date_after" | "due_date_before" | "status"> {
  switch (due) {
    case "overdue":
      return { status: "open", due_date_before: addDays(today, -1) };
    case "today":
      return { due_date_after: today, due_date_before: today };
    case "next_7_days":
      return { due_date_after: today, due_date_before: addDays(today, 7) };
    case "this_month": {
      const { from, to } = monthBounds(today);
      return { due_date_after: from, due_date_before: to };
    }
    default:
      return {};
  }
}

/** Client Component: busca, filtros, cache, baixa e cancelamento. A 1ª página vem hidratada do servidor. */
export function AccountsPayableTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ filterKeys: ["status", "holder", "condominium", "due"] });
  const today = todayIso();

  const { data, isLoading, isPlaceholderData } = useAccountsPayableList(
    {
      ...params,
      ...dueParams(filters.due, today),
      ...(filters.status ? { status: filters.status as AccountsPayableListStatus } : {}),
      ...(filters.condominium ? { condominium: filters.condominium } : {}),
      ...(filters.holder ? { is_company_expense: filters.holder === "company" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: condominiumsData } = useCondominiumsList({ limit: 100 });
  const cancelMutation = useAccountsPayableCancel();

  const handleCancel = (id: string) =>
    cancelMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAccountsPayableListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Conta cancelada.");
        },
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <AccountsPayableFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          condominiums={(condominiumsData?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma conta a pagar encontrada"
        emptyText="Cadastre uma conta ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Situação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((account) => (
                  <AccountPayableRow key={account.id} account={account} today={today} onCancel={handleCancel} />
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
