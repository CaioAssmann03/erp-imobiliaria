export const entriesUrl = () => "/finance/entries";
export const newEntryBatchUrl = () => "/finance/entries/new";
export const entryBatchUrl = (batchId: string) => `/finance/entries/${batchId}`;

/** Seções da página de um lote (e do lote novo), na ordem em que aparecem; o índice da direita usa estes ids. */
export const ENTRY_BATCH_SECTIONS = [
  { id: "lote", label: "Lote" },
  { id: "lancamentos", label: "Lançamentos" },
] as const;

export interface EntryBatchFrameState {
  /** A coluna da lista só envolve as telas do lançamento manual: a vazia, o lote novo e o lote aberto. */
  hasFrame: boolean;
  batchId: string | null;
  isNew: boolean;
  /** No celular a lista e o lote aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/finance/entries` (a vazia), `/finance/entries/new` e `/finance/entries/[batchId]`. */
export function entryBatchFrameState(pathname: string | null): EntryBatchFrameState {
  const none: EntryBatchFrameState = { hasFrame: false, batchId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "finance" || second !== "entries" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, batchId: third };
}
