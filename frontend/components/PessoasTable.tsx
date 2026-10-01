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
  getPessoasListQueryKey,
  usePessoasDestroy,
  usePessoasList,
} from "@/lib/api/generated";

/** Client Component: busca, cache e exclusão. A 1ª página vem hidratada do servidor. */
export function PessoasTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params } = useListParams();

  const { data, isLoading, isPlaceholderData } = usePessoasList(params, {
    query: { placeholderData: keepPreviousData },
  });
  const destroyMutation = usePessoasDestroy();

  const handleDelete = (id: number) => {
    // Excluindo o único item da última página: volta uma página.
    const goBack = (data?.results.length ?? 0) === 1 && page > 1;
    destroyMutation.mutate(
      { id },
      {
        onSuccess: () => {
          if (goBack) setPage(page - 1);
          queryClient.invalidateQueries({ queryKey: getPessoasListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Pessoa excluída.");
        },
        onError: () => toast.error("Não foi possível excluir a pessoa."),
      }
    );
  };

  const results = data?.results ?? [];

  return (
    <>
      <Toolbar right={data ? `${data.count} no total` : undefined}>
        <SearchField
          placeholder="Buscar por nome, CPF/CNPJ ou email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma pessoa encontrada"
        emptyText="Cadastre uma nova pessoa ou ajuste a busca."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((pessoa) => (
              <TableRow key={pessoa.id}>
                <TableCell>
                  <Link href={`/pessoas/${pessoa.id}`} className="block hover:opacity-70">
                    <NameCell name={pessoa.nome} sub={pessoa.email} />
                  </Link>
                </TableCell>
                <TableCell className="text-ink-soft">{pessoa.cpf_cnpj}</TableCell>
                <TableCell className="text-ink-soft">{pessoa.celular || "—"}</TableCell>
                <TableCell>
                  <StatusBadge ativo={pessoa.ativo} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <LinkButton variant="secondary" size="sm" href={`/pessoas/${pessoa.id}`}>
                      Editar
                    </LinkButton>
                    <ConfirmDeleteButton
                      title="Excluir pessoa?"
                      description={`"${pessoa.nome}" será excluída. Esta ação não pode ser desfeita.`}
                      onConfirm={() => handleDelete(pessoa.id)}
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
