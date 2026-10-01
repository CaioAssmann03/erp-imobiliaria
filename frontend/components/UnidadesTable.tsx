"use client";


import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useListParams } from "@/hooks/use-list-params";
import { UNIDADE_TIPOS } from "@/lib/schemas/unidade";
import {
  getDashboardRetrieveQueryKey,
  getUnidadesListQueryKey,
  useBlocosList,
  useUnidadesDestroy,
  useUnidadesList,
} from "@/lib/api/generated";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { FilterMenu } from "@/components/FilterMenu";
import {
  ListState,
  RowActions,
  RowLink,
  Toolbar,
} from "@/components/DataList";
import { Pagination } from "@/components/Pagination";
import { LinkButton } from "@/components/LinkButton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UnidadesTableProps {
  condominioId: number;
}

/** Client Component: lista de unidades (hidratada do servidor) com exclusão. */
export function UnidadesTable({ condominioId }: UnidadesTableProps) {
  const queryClient = useQueryClient();
  const { data: blocos } = useBlocosList({ condominio: condominioId, limit: 100 });
  const { page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ searchable: false, filterKeys: ["status", "tipo", "bloco"] });
  const {
    data: unidades,
    isLoading,
    isPlaceholderData,
  } = useUnidadesList(
    {
      condominio: condominioId,
      ...params,
      ...(filters.status ? { ativo: filters.status === "ativo" } : {}),
      ...(filters.tipo ? { tipo: filters.tipo as (typeof UNIDADE_TIPOS)[number]["value"] } : {}),
      ...(filters.bloco ? { bloco: Number(filters.bloco) } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const destroyMutation = useUnidadesDestroy();

  const blocoNome = (blocoId: number | null | undefined) => {
    if (!blocoId) return "—";
    return blocos?.results.find((bloco) => bloco.id === blocoId)?.nome ?? "—";
  };

  const handleDelete = (id: number) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (unidades?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getUnidadesListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Unidade excluída.");
        },
        onError: () => toast.error("Não foi possível excluir a unidade."),
      }
    );
  };

  const results = unidades?.results ?? [];

  return (
    <>
      <Toolbar right={unidades ? `${unidades.count} no total` : undefined}>
        <FilterMenu
          onClear={clearFilters}
          groups={[
            {
              key: "status",
              label: "Status",
              value: filters.status,
              onChange: (value) => setFilter("status", value),
              options: [
                { value: "ativo", label: "Ativas" },
                { value: "inativo", label: "Inativas" },
              ],
            },
            {
              key: "tipo",
              label: "Tipo",
              value: filters.tipo,
              onChange: (value) => setFilter("tipo", value),
              options: UNIDADE_TIPOS,
            },
            ...((blocos?.results.length ?? 0) > 0
              ? [
                  {
                    key: "bloco",
                    label: "Bloco",
                    value: filters.bloco,
                    onChange: (value: string) => setFilter("bloco", value),
                    options: (blocos?.results ?? []).map((bloco) => ({
                      value: String(bloco.id),
                      label: bloco.nome,
                    })),
                  },
                ]
              : []),
          ]}
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
                <TableHead>Unidade</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Proprietário(s) / Locatário(s)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((unidade) => (
                <TableRow key={unidade.id}>
                  <TableCell>
                    <RowLink href={`/condominios/${condominioId}/unidades/${unidade.id}`}>
                      {unidade.nome_unidade}
                    </RowLink>
                  </TableCell>
                  <TableCell className="text-ink-soft">{blocoNome(unidade.bloco)}</TableCell>
                  <TableCell className="text-ink-soft capitalize">{unidade.tipo}</TableCell>
                  <TableCell className="max-w-[22rem] truncate text-ink-soft">
                    {unidade.partes.length === 0
                      ? "—"
                      : unidade.partes
                          .map(
                            (parte) =>
                              `${parte.pessoa_detalhe.nome} (${
                                parte.papel === "proprietario" ? "Prop." : "Loc."
                              })`
                          )
                          .join(", ")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge ativo={unidade.ativo} />
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <LinkButton
                        variant="ghost"
                        size="sm"
                        href={`/condominios/${condominioId}/unidades/${unidade.id}`}
                      >
                        Editar
                      </LinkButton>
                      <ConfirmDeleteButton
                        title="Excluir unidade?"
                        description={`A unidade "${unidade.nome_unidade}" será excluída. Esta ação não pode ser desfeita.`}
                        onConfirm={() => handleDelete(unidade.id)}
                      />
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <Pagination
            page={page}
            limit={limit}
            count={unidades?.count ?? 0}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      </ListState>
    </>
  );
}
