"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ListState, NameCell, SearchField, Toolbar } from "@/components/DataList";
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
import { useListParams } from "@/hooks/use-list-params";
import {
  getDashboardRetrieveQueryKey,
  getCondominiosListQueryKey,
  useCondominiosDestroy,
  useCondominiosList,
} from "@/lib/api/generated";

/** Client Component: busca, cache e exclusão. A 1ª página vem hidratada do servidor. */
export function CondominiosTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params } = useListParams();

  const { data, isLoading, isPlaceholderData } = useCondominiosList(params, {
    query: { placeholderData: keepPreviousData },
  });
  const destroyMutation = useCondominiosDestroy();

  const handleDelete = (id: number) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getCondominiosListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Condomínio excluído.");
        },
        onError: () => toast.error("Não foi possível excluir o condomínio."),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <SearchField
          placeholder="Buscar por nome ou CNPJ"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum condomínio encontrado"
        emptyText="Cadastre um novo condomínio ou ajuste a busca."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((condominio) => (
              <TableRow key={condominio.id}>
                <TableCell>
                  <Link href={`/condominios/${condominio.id}`} className="block hover:opacity-70">
                    <NameCell name={condominio.nome} sub={condominio.cnpj} />
                  </Link>
                </TableCell>
                <TableCell className="text-ink-soft">
                  {condominio.cidade ? `${condominio.cidade}/${condominio.uf}` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge ativo={condominio.ativo} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <LinkButton
                      variant="secondary"
                      size="sm"
                      href={`/condominios/${condominio.id}/unidades`}
                    >
                      Unidades
                    </LinkButton>
                    <LinkButton
                      variant="secondary"
                      size="sm"
                      href={`/condominios/${condominio.id}`}
                    >
                      Editar
                    </LinkButton>
                    <ConfirmDeleteButton
                      title="Excluir condomínio?"
                      description={`O condomínio "${condominio.nome}" será excluído. Esta ação não pode ser desfeita.`}
                      onConfirm={() => handleDelete(condominio.id)}
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
            count={data?.count ?? 0}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      </ListState>
    </>
  );
}
