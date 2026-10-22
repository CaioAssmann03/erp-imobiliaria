/**
 * Ordenação de uma listagem pelo cabeçalho da coluna. Funções puras, sem imports do app: rodam direto no `node --test`.
 */

export type SortDirection = "asc" | "desc";

/** A coluna ordenada e o sentido. */
export interface SortState<Column extends string> {
  column: Column;
  direction: SortDirection;
}

/** Como uma listagem ordena: o estado inicial (a ordem padrão do servidor) e o `ordering` da API de cada coluna. */
export interface SortConfig<Column extends string, Ordering extends string> {
  initial: SortState<Column>;
  /** `[crescente, decrescente]` de cada coluna, como a API os espera. */
  orderings: Record<Column, readonly [Ordering, Ordering]>;
}

/** O estado depois de um clique no cabeçalho: a coluna ordenada inverte o sentido, outra começa crescente. */
export function nextSort<Column extends string>(current: SortState<Column>, clicked: Column): SortState<Column> {
  if (current.column !== clicked) return { column: clicked, direction: "asc" };
  return { column: clicked, direction: current.direction === "asc" ? "desc" : "asc" };
}

/** O `ordering` da API para o estado; `undefined` na ordem inicial, que o servidor já usa (e o prefetch espelha). */
export function orderingOf<Column extends string, Ordering extends string>(
  config: SortConfig<Column, Ordering>,
  state: SortState<Column>,
): Ordering | undefined {
  const isInitial = state.column === config.initial.column && state.direction === config.initial.direction;
  if (isInitial) return undefined;
  const [ascending, descending] = config.orderings[state.column];
  return state.direction === "asc" ? ascending : descending;
}
