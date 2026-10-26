"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ListState, RowActions, RowLink, SearchField, Toolbar } from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { LinkButton } from "@/components/LinkButton";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getCostCentersListQueryKey,
  useCondominiumsList,
  useCostCentersDestroy,
  useCostCentersList,
} from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { applyServerErrors } from "@/lib/form-errors";

/** Client Component: lista de sub-contas com busca, filtros e exclusão. O condomínio filtrado vem da URL (`?condominium=`). */
export function CostCentersTable() {
  const initialCondominium = useSearchParams().get("condominium") ?? undefined;
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({
      filterKeys: ["status", "condominium"],
      initialFilters: { condominium: initialCondominium ?? "" },
    });
  const { data, isLoading, isPlaceholderData } = useCostCentersList(
    {
      ...params,
      ...(filters.condominium ? { condominium: filters.condominium } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: condominiumsData } = useCondominiumsList({ limit: 100 });
  const condominiums = condominiumsData?.results ?? [];
  const condominiumName = (id: string) => condominiums.find((item) => item.id === id)?.name ?? "—";
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
              key: "condominium",
              label: "Condomínio",
              searchable: true,
              value: filters.condominium,
              onChange: (value) => setFilter("condominium", value),
              options: condominiums.map((item) => ({ value: item.id, label: item.name })),
            },
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
                  <TableHead className="hidden md:table-cell">Condomínio</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((costCenter) => {
                  const href = `/condominiums/cost-centers/${costCenter.id}`;
                  return (
                    <TableRow key={costCenter.id}>
                      <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">
                        {formatCode(costCenter.code)}
                      </TableCell>
                      <TableCell>
                        <RowLink
                          href={href}
                          sub={[formatCode(costCenter.code), condominiumName(costCenter.condominium), costCenter.active ? null : "Inativa"]
                            .filter(Boolean)
                            .join(" · ")}
                        >
                          {costCenter.name}
                        </RowLink>
                      </TableCell>
                      <TableCell className="hidden max-w-[16rem] truncate text-ink-soft md:table-cell">
                        {condominiumName(costCenter.condominium)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge active={costCenter.active} />
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
