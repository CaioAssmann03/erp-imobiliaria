"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  ListState,
  RowActions,
  RowLink,
  Toolbar,
} from "@/components/data-list";
import { FilterMenu } from "@/components/FilterMenu";
import { LinkButton } from "@/components/LinkButton";
import { Pagination } from "@/components/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getBlocksListQueryKey,
  getUnitsListQueryKey,
  useBlocksDestroy,
  useBlocksList,
  useCondominiumsList,
} from "@/lib/api/generated";

/** Client Component: lista de blocos com filtro por condomínio e exclusão. O condomínio já filtrado ao abrir vem da URL (`?condominium=`, de "Blocos" na lista de condomínios). */
export function BlocksTable({ condominiumId }: { condominiumId?: string }) {
  const initialCondominium = useSearchParams().get("condominium") ?? undefined;
  const queryClient = useQueryClient();
  const {
    page,
    setPage,
    limit,
    setLimit,
    params,
    filters,
    setFilter,
    clearFilters,
  } = useListParams({
    searchable: false,
    filterKeys: ["condominium"],
    initialFilters: { condominium: initialCondominium ?? "" },
  });
  const { data, isLoading, isPlaceholderData } = useBlocksList(
    {
      ...params,
      condominium: condominiumId ?? (filters.condominium || undefined),
    },
    { query: { placeholderData: keepPreviousData } },
  );
  const isOverview = !condominiumId;
  const { data: condominiumsData } = useCondominiumsList(
    { limit: 100 },
    { query: { enabled: isOverview } },
  );
  const condominiums = condominiumsData?.results ?? [];
  const condominiumName = (id: string) =>
    condominiums.find((item) => item.id === id)?.name ?? "—";
  const destroyMutation = useBlocksDestroy();

  const handleDelete = (id: string) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getBlocksListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() });
          toast.success("Bloco excluído.");
        },
        onError: () => toast.error("Não foi possível excluir o bloco."),
      },
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        {isOverview && (
          <FilterMenu
            onClear={clearFilters}
            groups={[
              {
                key: "condominium",
                label: "Condomínio",
                searchable: true,
                value: filters.condominium,
                onChange: (value) => setFilter("condominium", value),
                options: condominiums.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              },
            ]}
          />
        )}
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum bloco cadastrado"
        emptyText="Adicione um bloco ou ajuste os filtros."
      >
        <>
          <div
            className={
              isPlaceholderData
                ? "opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Bloco</TableHead>
                  {isOverview && (
                    <TableHead className="hidden md:table-cell">
                      Condomínio
                    </TableHead>
                  )}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((block) => {
                  const href = `/condominiums/blocks/${block.id}`;
                  return (
                    <TableRow key={block.id}>
                      <TableCell>
                        <RowLink
                          href={href}
                          sub={
                            isOverview
                              ? condominiumName(block.condominium)
                              : undefined
                          }
                        >
                          {block.name}
                        </RowLink>
                      </TableCell>
                      {isOverview && (
                        <TableCell className="hidden max-w-[16rem] truncate text-ink-soft md:table-cell">
                          {condominiumName(block.condominium)}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="relative z-10 flex items-center justify-end gap-1">
                          <LinkButton
                            variant="ghost"
                            size="sm"
                            className="text-ink-soft"
                            href={`/condominiums/units?condominium=${block.condominium}&block=${block.id}`}
                          >
                            Ver unidades
                          </LinkButton>
                          <RowActions>
                            <LinkButton
                              variant="ghost"
                              size="sm"
                              className="hidden md:inline-flex"
                              href={href}
                            >
                              Editar
                            </LinkButton>
                            <ConfirmDeleteButton
                              title="Excluir bloco?"
                              description={`O bloco "${block.name}" será excluído. Esta ação não pode ser desfeita.`}
                              onConfirm={() => handleDelete(block.id)}
                            />
                          </RowActions>
                        </div>
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
