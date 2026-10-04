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
  getCondominiosListQueryKey,
  useCondominiosDestroy,
  useCondominiosList,
} from "@/lib/api/generated";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

/** Client Component: busca, cache e exclusão. A 1ª página vem hidratada do servidor. */
export function CondominiosTable() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, limit, setLimit, params, filters, setFilter, clearFilters } =
    useListParams({ filterKeys: ["status", "tipo"] });

  const { data, isLoading, isPlaceholderData } = useCondominiosList(
    {
      ...params,
      ...(filters.status ? { ativo: filters.status === "ativo" } : {}),
      ...(filters.tipo ? { tipo: filters.tipo as "residencial" | "comercial" } : {}),
    },
    {
      query: { placeholderData: keepPreviousData },
    }
  );
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
              label: "Tipo",
              value: filters.tipo,
              onChange: (value) => setFilter("tipo", value),
              options: [
                { value: "residencial", label: "Residencial" },
                { value: "comercial", label: "Comercial" },
              ],
            },
          ]}
        />
      </Toolbar>

      <ListState
        isLoading={isLoading}
        isEmpty={results.length === 0}
        emptyTitle="Nenhum condomínio encontrado"
        emptyText="Cadastre um novo condomínio ou ajuste a busca e os filtros."
      >
        <>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Cidade</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((condominio) => (
                <TableRow key={condominio.id}>
                  <TableCell>
                    <RowLink
                      compact
                      href={`/condominios/${condominio.id}`}
                      sub={[
                        condominio.cidade ? `${condominio.cidade}/${condominio.uf}` : null,
                        condominio.ativo ? null : "Inativo",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      {condominio.nome}
                    </RowLink>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-ink-soft tabular-nums">{condominio.cnpj || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-ink-soft">
                    {condominio.cidade ? `${condominio.cidade}/${condominio.uf}` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge ativo={condominio.ativo} />
                  </TableCell>
                  <TableCell>
                    <div className="relative z-10 flex items-center justify-end gap-1">
                      <LinkButton
                        variant="secondary"
                        size="sm"
                        href={`/condominios/${condominio.id}/unidades`}
                      >
                        Unidades
                      </LinkButton>
                      <RowActions>
                        <LinkButton
                          variant="ghost"
                          size="sm"
                          className="hidden md:inline-flex"
                          href={`/condominios/${condominio.id}`}
                        >
                          Editar
                        </LinkButton>
                        <ConfirmDeleteButton
                          title="Excluir condomínio?"
                          description={`O condomínio "${condominio.nome}" será excluído. Esta ação não pode ser desfeita.`}
                          onConfirm={() => handleDelete(condominio.id)}
                        />
                      </RowActions>
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
