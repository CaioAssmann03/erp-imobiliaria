"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { ListState } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import { useBillingRunsList, useCondominiumsList } from "@/lib/api/generated";
import type { BillingRunsListStatus } from "@/lib/api/generated/models";

import { BillingRunRow } from "./BillingRunRow";
import { BillingRunsFilters } from "./BillingRunsFilters";

/** Client Component: execuções da emissão mensal (hidratada do servidor), da mais recente à mais antiga. */
export function BillingRunsTable() {
  const { page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } = useListParams({
    searchable: false,
    filterKeys: ["condominium", "month", "status"],
  });
  const { data, isLoading, isPlaceholderData } = useBillingRunsList(
    {
      ...params,
      ...(filters.condominium ? { condominium: filters.condominium } : {}),
      ...(filters.month ? { reference_month: filters.month } : {}),
      ...(filters.status ? { status: filters.status as BillingRunsListStatus } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const results = data?.results ?? [];

  return (
    <>
      <BillingRunsFilters
        filters={filters}
        onFilterChange={setFilter}
        onClear={clearFilters}
        condominiums={condominiums?.results ?? []}
        total={data?.count}
      />
      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma execução encontrada"
        emptyText="A emissão roda sozinha no dia configurado de cada condomínio. Use Emitir mês para emitir agora."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Condomínio</TableHead>
                  <TableHead className="hidden md:table-cell">Referência</TableHead>
                  <TableHead className="hidden md:table-cell">Situação</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Emitidos</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Já emitidos</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Pulados</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Falhas</TableHead>
                  <TableHead className="hidden md:table-cell">Início</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((run) => (
                  <BillingRunRow key={run.id} run={run} />
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
