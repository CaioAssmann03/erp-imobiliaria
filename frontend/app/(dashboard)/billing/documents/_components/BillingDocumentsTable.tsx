"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { ListState } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import { useBillingDocumentsList, useCondominiumsList } from "@/lib/api/generated";
import type { BillingDocumentsListStatus } from "@/lib/api/generated/models";

import { BillingDocumentRow } from "./BillingDocumentRow";
import { BillingDocumentsFilters } from "./BillingDocumentsFilters";

/** Client Component: lista de documentos de cobrança (hidratada do servidor) com busca e filtros. */
export function BillingDocumentsTable({
  initialCondominium,
  initialMonth,
}: {
  initialCondominium?: string;
  initialMonth?: string;
}) {
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({
      filterKeys: ["condominium", "status", "month", "overdue"],
      initialFilters: { condominium: initialCondominium ?? "", month: initialMonth ?? "" },
    });
  const { data, isLoading, isPlaceholderData } = useBillingDocumentsList(
    {
      ...params,
      ...(filters.condominium ? { condominium: filters.condominium } : {}),
      ...(filters.status ? { status: filters.status as BillingDocumentsListStatus } : {}),
      ...(filters.month ? { reference_month: filters.month } : {}),
      ...(filters.overdue ? { is_overdue: true } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const results = data?.results ?? [];

  return (
    <>
      <BillingDocumentsFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilter}
        onClear={clearFilters}
        condominiums={condominiums?.results ?? []}
        total={data?.count}
      />
      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum documento de cobrança encontrado"
        emptyText="Os documentos aparecem quando a emissão do mês roda. Ajuste a busca e os filtros ou emita um mês em Execuções."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Unidade</TableHead>
                  <TableHead className="hidden md:table-cell">Condomínio</TableHead>
                  <TableHead className="hidden md:table-cell">Pagador</TableHead>
                  <TableHead className="hidden md:table-cell">Referência</TableHead>
                  <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((document) => (
                  <BillingDocumentRow key={document.id} document={document} />
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
