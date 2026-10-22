import type { CondominiumsListOrdering } from "@/lib/api/generated/models";
import type { SortConfig } from "@/lib/list-sort";

export type CondominiumSortColumn = "code" | "name" | "status";

/**
 * As colunas ordenáveis da lista. A lista abre por nome, crescente: é a ordem padrão do servidor, então não vai no pedido.
 * Em Status, "crescente" põe os ativos primeiro (a ordem alfabética dos rótulos "Ativo" e "Inativo").
 */
export const CONDOMINIUM_SORT: SortConfig<CondominiumSortColumn, CondominiumsListOrdering> = {
  initial: { column: "name", direction: "asc" },
  orderings: {
    code: ["code", "-code"],
    name: ["name", "-name"],
    status: ["-active", "active"],
  },
};
