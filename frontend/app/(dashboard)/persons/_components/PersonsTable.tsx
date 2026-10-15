"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ListState, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getDashboardRetrieveQueryKey,
  getPersonsListQueryKey,
  usePersonsDestroy,
  usePersonsList,
} from "@/lib/api/generated";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";

import { PersonRow } from "./PersonRow";
import { PersonsFilters } from "./PersonsFilters";

/** Client Component: busca, cache e exclusão. A 1ª página vem hidratada do servidor. */
export function PersonsTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ filterKeys: ["status", "type"] });

  const { data, isLoading, isPlaceholderData } = usePersonsList(
    {
      ...params,
      module: CONDOMINIUMS_MODULE,
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.type ? { type: filters.type as "individual" | "legal" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = usePersonsDestroy();

  const handleDelete = (id: string) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getPersonsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Pessoa excluída.");
        },
        onError: () => toast.error("Não foi possível excluir a pessoa."),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <PersonsFilters
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
        emptyTitle="Nenhuma pessoa encontrada"
        emptyText="Cadastre uma nova pessoa ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden w-16 md:table-cell">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">Celular</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((person) => (
                  <PersonRow key={person.id} person={person} onDelete={handleDelete} />
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
