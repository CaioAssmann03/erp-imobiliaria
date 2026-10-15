"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ListState, Toolbar } from "@/components/data-list";
import { Pagination } from "@/components/Pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/use-list-params";
import {
  getDashboardRetrieveQueryKey,
  getUnitsListQueryKey,
  useBlocksList,
  useCondominiumsList,
  useUnitsDestroy,
  useUnitsList,
} from "@/lib/api/generated";
import type { UnitsListPending } from "@/lib/api/generated/models";
import type { UNIT_TYPES } from "@/lib/schemas/unit";

import { UnitRow } from "./UnitRow";
import { UnitsFilters } from "./UnitsFilters";

/** Client Component: lista de unidades (hidratada do servidor) com filtros e exclusão. */
export function UnitsTable({
  condominiumId,
  initialCondominium,
  initialBlock,
  initialPending,
}: {
  condominiumId?: string;
  /** Filtros já aplicados ao abrir (vêm de "Unidades" / "Ver unidades" nas outras listas). */
  initialCondominium?: string;
  initialBlock?: string;
  initialPending?: string;
}) {
  const queryClient = useQueryClient();
  const { page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } = useListParams({
    searchable: false,
    filterKeys: ["status", "type", "block", "condominium", "pending"],
    initialFilters: {
      condominium: initialCondominium ?? "",
      block: initialBlock ?? "",
      pending: initialPending ?? "",
    },
  });
  // Visão geral (sem condomínio fixo): o condomínio vira filtro e aparece em cada linha.
  const isOverview = !condominiumId;
  const scopedCondominium = condominiumId ?? (filters.condominium || undefined);
  const { data: blocksData } = useBlocksList({ condominium: scopedCondominium, limit: 100 });
  const blocks = blocksData?.results ?? [];
  const { data: condominiumsData } = useCondominiumsList({ limit: 100 }, { query: { enabled: isOverview } });
  const condominiums = condominiumsData?.results ?? [];
  const condominiumName = (id: string) => condominiums.find((condominium) => condominium.id === id)?.name ?? null;

  const handleFilterChange = (key: "status" | "type" | "block" | "condominium" | "pending", value: string) => {
    setFilter(key, value);
    if (key === "condominium") setFilter("block", ""); // o bloco pertence ao condomínio
  };

  const { data, isLoading, isPlaceholderData } = useUnitsList(
    {
      condominium: scopedCondominium,
      ...params,
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.type ? { type: filters.type as (typeof UNIT_TYPES)[number]["value"] } : {}),
      ...(filters.block ? { block: filters.block } : {}),
      ...(filters.pending ? { pending: filters.pending as UnitsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = useUnitsDestroy();

  const blockName = (blockId: string | null | undefined) =>
    blocks.find((block) => block.id === blockId)?.name ?? null;

  const handleDelete = (id: string) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Unidade excluída.");
        },
        onError: () => toast.error("Não foi possível excluir a unidade."),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <UnitsFilters
          blocks={blocks}
          condominiums={isOverview ? condominiums : undefined}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma unidade cadastrada"
        emptyText="Adicione uma unidade ou ajuste os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="hidden w-16 md:table-cell">ID</TableHead>
                  <TableHead>Unidade</TableHead>
                  {isOverview && <TableHead className="hidden md:table-cell">Condomínio</TableHead>}
                  <TableHead className="hidden md:table-cell">Bloco</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Proprietário(s) / Locatário(s)</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((unit) => (
                  <UnitRow
                    key={unit.id}
                    unit={unit}
                    condominiumId={unit.condominium}
                    condominiumName={isOverview ? (condominiumName(unit.condominium) ?? "—") : null}
                    blockName={blockName(unit.block)}
                    onDelete={handleDelete}
                  />
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
