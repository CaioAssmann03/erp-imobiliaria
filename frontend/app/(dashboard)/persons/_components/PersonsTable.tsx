"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { FilterMenu } from "@/components/FilterMenu";
import {
  ListState,
  RowActions,
  RowLink,
  SearchField,
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
import { useListParams } from "@/hooks/use-list-params";
import {
  getDashboardRetrieveQueryKey,
  getPessoasListQueryKey,
  usePessoasDestroy,
  usePessoasList,
} from "@/lib/api/generated";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

/** Client Component: busca, cache e exclusão. A 1ª página vem hidratada do servidor. */
export function PessoasTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ filterKeys: ["status", "tipo"] });

  const { data, isLoading, isPlaceholderData } = usePessoasList(
    {
      ...params,
      ...(filters.status ? { ativo: filters.status === "ativo" } : {}),
      ...(filters.tipo ? { tipo_pessoa: filters.tipo as "fisica" | "juridica" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
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
        <FilterMenu
          onClear={clearFilters}
          groups={[
            {
              key: "status",
              label: "Status",
              value: filters.status,
              onChange: (value) => setFilter("status", value),
              options: STATUS_OPTIONS,
            },
            {
              key: "tipo",
              label: "Tipo de pessoa",
              value: filters.tipo,
              onChange: (value) => setFilter("tipo", value),
              options: [
                { value: "fisica", label: "Física" },
                { value: "juridica", label: "Jurídica" },
              ],
            },
          ]}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhuma pessoa encontrada"
        emptyText="Cadastre uma nova pessoa ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Celular</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell>
                    <RowLink
                      href={`/pessoas/${pessoa.id}`}
                      sub={[pessoa.email || pessoa.cpf_cnpj, pessoa.ativo ? null : "Inativo"]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      {pessoa.nome}
                    </RowLink>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-ink-soft tabular-nums">{pessoa.cpf_cnpj}</TableCell>
                  <TableCell className="hidden md:table-cell text-ink-soft tabular-nums">{pessoa.celular || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[14rem] truncate text-ink-soft" title={pessoa.email || undefined}>
                    {pessoa.email || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge ativo={pessoa.ativo} />
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <LinkButton
                        variant="ghost"
                        size="sm"
                        className="hidden md:inline-flex"
                        href={`/pessoas/${pessoa.id}`}
                      >
                        Editar
                      </LinkButton>
                      <ConfirmDeleteButton
                        title="Excluir pessoa?"
                        description={`"${pessoa.nome}" será excluída. Esta ação não pode ser desfeita.`}
                        onConfirm={() => handleDelete(pessoa.id)}
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
            count={data?.count ?? 0}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      </ListState>
    </>
  );
}
