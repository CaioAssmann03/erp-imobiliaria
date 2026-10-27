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
import { getBillingEventsListQueryKey, useBillingEventsDestroy, useBillingEventsList } from "@/lib/api/generated";
import { applyServerErrors } from "@/lib/form-errors";

/** Client Component: lista de eventos com busca, filtro de status e exclusão. */
export function BillingEventsTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } = useListParams({
    filterKeys: ["status"],
  });
  const { data, isLoading, isPlaceholderData } = useBillingEventsList(
    { ...params, ...(filters.status ? { active: filters.status === "active" } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = useBillingEventsDestroy();

  const handleDelete = (id: string) => {
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getBillingEventsListQueryKey() });
          toast.success("Evento excluído.");
        },
        // Um evento usado por lançamentos não sai: o backend recusa (desative em vez de excluir).
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
                { value: "active", label: "Ativos" },
                { value: "inactive", label: "Inativos" },
              ],
            },
          ]}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum evento encontrado"
        emptyText="Cadastre um evento ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((event) => {
                  const href = `/billing/events/${event.id}`;
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="tabular-nums text-ink-soft">{event.code}</TableCell>
                      <TableCell>
                        <RowLink href={href} sub={[event.credits_company ? "Receita da imobiliária" : null, event.active ? null : "Inativo"].filter(Boolean).join(" · ") || undefined}>
                          {event.name}
                        </RowLink>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge active={event.active} />
                      </TableCell>
                      <TableCell>
                        <RowActions>
                          <LinkButton variant="ghost" size="sm" className="hidden md:inline-flex" href={href}>
                            Editar
                          </LinkButton>
                          <ConfirmDeleteButton
                            title="Excluir evento?"
                            description={`O evento "${event.name}" será excluído. Esta ação não pode ser desfeita.`}
                            onConfirm={() => handleDelete(event.id)}
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
