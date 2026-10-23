"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ListState } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getBillingPlansListQueryKey,
  useBillingPlansDestroy,
  useBillingPlansList,
  useCondominiumsList,
} from "@/lib/api/generated";
import { apiErrorMessage } from "@/lib/form-errors";

import { BillingPlanRow } from "./BillingPlanRow";
import { BillingPlansFilters } from "./BillingPlansFilters";

/** Client Component: lista de planos de cobrança com busca, filtros e exclusão. O condomínio filtrado vem da URL (`?condominium=`). */
export function BillingPlansTable() {
  const initialCondominium = useSearchParams().get("condominium") ?? undefined;
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({
      filterKeys: ["status", "condominium"],
      initialFilters: { condominium: initialCondominium ?? "" },
    });
  const { data, isLoading, isPlaceholderData } = useBillingPlansList(
    {
      ...params,
      ...(filters.condominium ? { condominium: filters.condominium } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const destroyMutation = useBillingPlansDestroy();

  const handleDelete = (id: string) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getBillingPlansListQueryKey() });
          toast.success("Plano de cobrança excluído.");
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível excluir o plano.")),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <BillingPlansFilters
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
        emptyTitle="Nenhum plano de cobrança encontrado"
        emptyText="Cadastre um plano ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Plano</TableHead>
                  <TableHead className="hidden md:table-cell">Condomínio</TableHead>
                  <TableHead className="hidden md:table-cell">Itens</TableHead>
                  <TableHead className="hidden md:table-cell">Vigência</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((plan) => (
                  <BillingPlanRow key={plan.id} plan={plan} onDelete={handleDelete} />
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
