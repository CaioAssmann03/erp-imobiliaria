"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ListState, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getCondominiumsListQueryKey,
  getDashboardRetrieveQueryKey,
  useCondominiumsDestroy,
  useCondominiumsList,
} from "@/lib/api/generated";

import type { CondominiumsListPending } from "@/lib/api/generated/models";

import { CondominiumRow } from "./CondominiumRow";
import { CondominiumsFilters } from "./CondominiumsFilters";

/** Client Component: busca, cache e exclusão. O filtro `?pending=` vem da URL (dashboard → Pendências). */
export function CondominiumsTable() {
  const initialPending = useSearchParams().get("pending") ?? undefined;
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({
      filterKeys: ["status", "type", "pending"],
      initialFilters: { pending: initialPending ?? "" },
    });

  const { data, isLoading, isPlaceholderData } = useCondominiumsList(
    {
      ...params,
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.type ? { type: filters.type as "residential" | "commercial" } : {}),
      ...(filters.pending ? { pending: filters.pending as CondominiumsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = useCondominiumsDestroy();

  const handleDelete = (id: string) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getCondominiumsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Condomínio excluído.");
        },
        onError: () => toast.error("Não foi possível excluir o condomínio."),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <CondominiumsFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={setFilter}
          onClear={clearFilters}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum condomínio encontrado"
        emptyText="Cadastre um novo condomínio ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden w-16 md:table-cell">ID</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((condominium) => (
                  <CondominiumRow key={condominium.id} condominium={condominium} onDelete={handleDelete} />
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            limit={limit}
            count={data?.count ?? 0}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      </ListState>
    </>
  );
}
