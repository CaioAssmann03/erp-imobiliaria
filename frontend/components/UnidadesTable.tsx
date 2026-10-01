"use client";

import Link from "next/link";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useListParams } from "@/hooks/use-list-params";
import {
  getDashboardRetrieveQueryKey,
  getUnidadesListQueryKey,
  useBlocosList,
  useUnidadesDestroy,
  useUnidadesList,
} from "@/lib/api/generated";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ListState } from "@/components/DataList";
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
  const { page, setPage, limit, setLimit, params } = useListParams({ searchable: false });
  const {
    data: unidades,
    isLoading,
    isPlaceholderData,
  } = useUnidadesList(
    { condominio: condominioId, ...params },
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
    <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma unidade cadastrada"
        emptyText="Adicione a primeira unidade deste condomínio."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Unidade</TableHead>
              <TableHead>Bloco</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Proprietário(s)/Locatário(s)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((unidade) => (
              <TableRow key={unidade.id}>
                <TableCell>
                  <Link
                    href={`/condominios/${condominioId}/unidades/${unidade.id}`}
                    className="font-medium hover:underline"
                  >
                    {unidade.nome_unidade}
                  </Link>
                </TableCell>
                <TableCell className="text-ink-soft">
                  {blocoNome(unidade.bloco)}
                </TableCell>
                <TableCell className="text-ink-soft">{unidade.tipo}</TableCell>
                <TableCell className="whitespace-normal text-ink-soft">
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
                  <div className="flex items-center justify-end gap-1">
                    <LinkButton
                      variant="secondary"
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
                  </div>
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
  );
}
