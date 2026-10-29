"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ListState, RowActions, RowLink, SearchField, Toolbar } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { LinkButton } from "@/components/LinkButton";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getCostCentersListQueryKey,
  useCostCentersDestroy,
  useCostCentersList,
} from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { applyServerErrors } from "@/lib/form-errors";

/** Client Component: sub-contas de um condomínio (seção dele) com busca, filtro de status e exclusão. */
export function CostCentersTable({ condominiumId }: { condominiumId: string }) {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({
      filterKeys: ["status"],
    });
  const { data, isLoading, isPlaceholderData } = useCostCentersList(
    {
      ...params,
      condominium: condominiumId,
      ...(filters.status ? { active: filters.status === "active" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = useCostCentersDestroy();

  const handleDelete = (id: string) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getCostCentersListQueryKey() });
          toast.success("Sub-conta excluída.");
        },
        // Com modelos de lançamento vinculados o backend recusa (desative em vez de excluir).
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <SearchField
          placeholder="Buscar por nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterMenu
          onClear={clearFilters}
          groups={[
            {
              key: "status",
              label: "Status",
              value: filters.status,
              onChange: (value) => setFilter("status", value),
              options: [
                { value: "active", label: "Ativas" },
                { value: "inactive", label: "Inativas" },
              ],
            },
          ]}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma sub-conta encontrada"
        emptyText="Adicione uma sub-conta ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden w-20 md:table-cell">Cód.</TableHead>
                  <TableHead>Sub-conta</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((costCenter) => {
                  const href = `/condominiums/${condominiumId}/cost-centers/${costCenter.id}`;
                  return (
                    <TableRow key={costCenter.id}>
                      <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">
                        {formatCode(costCenter.code)}
                      </TableCell>
                      <TableCell>
                        <RowLink
                          href={href}
                          sub={[formatCode(costCenter.code), costCenter.active ? null : "Inativa"]
                            .filter(Boolean)
                            .join(" · ")}
                        >
                          {costCenter.name}
                          {!costCenter.active && <span className="hidden text-ink-soft md:inline"> · Inativa</span>}
                        </RowLink>
                      </TableCell>
                      <TableCell>
                        <RowActions>
                          <LinkButton variant="ghost" size="sm" className="hidden md:inline-flex" href={href}>
                            Editar
                          </LinkButton>
                          <ConfirmDeleteButton
                            title="Excluir sub-conta?"
                            description={`A sub-conta "${costCenter.name}" será excluída. Esta ação não pode ser desfeita.`}
                            onConfirm={() => handleDelete(costCenter.id)}
                          />
                        </RowActions>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
