import { useState } from "react";

import { nextSort, orderingOf } from "@/lib/list-sort";
import type { SortConfig, SortState } from "@/lib/list-sort";

/**
 * Estado da ordenação de uma listagem pelo cabeçalho das colunas. `ordering` entra nos params da consulta
 * (fica de fora na ordem inicial, então a 1ª carga usa a mesma chave de cache do prefetch do servidor);
 * `onChange` avisa a listagem, que volta para a primeira página.
 */
export function useListSort<Column extends string, Ordering extends string>(
  config: SortConfig<Column, Ordering>,
  onChange?: () => void,
) {
  const [sort, setSort] = useState<SortState<Column>>(config.initial);

  const toggleSort = (column: Column) => {
    setSort((current) => nextSort(current, column));
    onChange?.();
  };

  return { sort, ordering: orderingOf(config, sort), toggleSort };
}
