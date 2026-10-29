"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
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
  getCostCenterCatalogListQueryKey,
  useCostCenterCatalogDestroy,
  useCostCenterCatalogList,
} from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { applyServerErrors } from "@/lib/form-errors";

/** Client Component: o catálogo de sub-contas da administradora, com busca, filtro de status e exclusão. */
export function CatalogTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } = useListParams({
    filterKeys: ["status"],
  });
  const { data, isLoading, isPlaceholderData } = useCostCenterCatalogList(
    { ...params, ...(filters.status ? { active: filters.status === "active" } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = useCostCenterCatalogDestroy();

  const handleDelete = (id: string) => {
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getCostCenterCatalogListQueryKey() });
          toast.success("Sub-conta excluída.");
        },
        // Uma sub-conta que condomínios usam não sai: o backend recusa (desative em vez de excluir).
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <SearchField placeholder="Buscar por nome" value={search} onChange={(event) => setSearch(event.target.value)} />
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
        emptyTitle="Nenhuma sub-conta no catálogo"
        emptyText="Cadastre as sub-contas da administradora (Conta Normal, Fundo de Reserva, Obras…); cada condomínio escolhe as que usa."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Sub-conta</TableHead>
                  <TableHead className="hidden md:table-cell">Condomínios</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item) => {
                  const href = `/finance/cost-center-catalog/${item.id}`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="tabular-nums text-ink-soft">{formatCode(item.code ?? 0)}</TableCell>
                      <TableCell>
                        <RowLink href={href} sub={item.active ? undefined : "Inativa"}>
                          {item.name}
                        </RowLink>
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">{item.cost_center_count}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge active={item.active} />
                      </TableCell>
                      <TableCell>
                        <RowActions>
                          <LinkButton variant="ghost" size="sm" className="hidden md:inline-flex" href={href}>
                            Editar
                          </LinkButton>
                          <ConfirmDeleteButton
                            title="Excluir sub-conta do catálogo?"
                            description={`A sub-conta "${item.name}" será excluída do catálogo. Se algum condomínio a usa, o sistema recusa: desative-a.`}
                            onConfirm={() => handleDelete(item.id)}
                          />
                        </RowActions>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} limit={limit} count={data?.count ?? 0} onPageChange={setPage} onLimitChange={setLimit} />
        </>
      </ListState>
    </>
  );
}
