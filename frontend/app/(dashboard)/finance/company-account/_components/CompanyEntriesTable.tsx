"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { ListState, SearchField, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import { useCompanyEntriesBalance, useCompanyEntriesList } from "@/lib/api/generated";
import { brl, formatDate, formatMonth } from "@/lib/format";

/** Client Component: o razão da imobiliária (as tarifas recebidas), com busca e o saldo. */
export function CompanyEntriesTable() {
  const { search, setSearch, page, setPage, limit, setLimit, params } = useListParams({ filterKeys: [] });
  const { data, isLoading, isPlaceholderData } = useCompanyEntriesList(params, { query: { placeholderData: keepPreviousData } });
  const { data: balance } = useCompanyEntriesBalance();
  const results = data?.results ?? [];

  return (
    <>
      <div className="mb-4 rounded-card bg-card p-5 shadow-card">
        <p className="text-caption font-medium text-ink-soft">Saldo da imobiliária</p>
        <p className="text-title tabular-nums">{balance ? brl(balance.balance) : "—"}</p>
      </div>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <SearchField placeholder="Buscar pela descrição" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Toolbar>
      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum lançamento da imobiliária"
        emptyText="Aparecem aqui quando um boleto com tarifa de registro é pago."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Competência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="tabular-nums text-ink-soft">{formatDate(entry.entry_date)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">{formatMonth(entry.reference_month)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{brl(entry.amount)}</TableCell>
                  </TableRow>
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
