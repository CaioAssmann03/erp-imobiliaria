import { registryFrame } from "../navigation/registry-frame.ts";
import { condominiumScope, monthParam, scopeUrl, type CondominiumMonthScope, type UrlParams } from "../navigation/url-scope.ts";

/** Quantos lançamentos um condomínio pode ter num mês: a lista da esquerda, a grade e o detalhe leem este mesmo tanto (uma só consulta). */
export const MAX_ENTRIES_PER_MONTH = 100;

/** Seções da página de um lançamento novo, na ordem em que aparecem; o índice da direita usa estes ids. */
export const NEW_BILLING_ENTRY_SECTIONS = [
  { id: "lancamento", label: "Lançamento" },
  { id: "rateio", label: "Rateio e valor" },
  { id: "unidades", label: "Unidades" },
  { id: "valores", label: "Valores" },
] as const;

/** Seções da página de um lançamento aberto. */
export const BILLING_ENTRY_SECTIONS = [
  { id: "lancamento", label: "Lançamento" },
  { id: "valores", label: "Valores" },
] as const;

/** O escopo da lista: o condomínio e o mês (primeiro dia, "2026-10-01") que ela, a grade e o detalhe mostram. Viaja na URL. */
export type BillingEntriesScope = CondominiumMonthScope;

/** O primeiro dia do mês de hoje (no fuso local), o mês em que a lista abre. */
export const currentMonthIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

/** O escopo lido da URL: só um UUID vale como condomínio e só um primeiro dia de mês como mês (senão, o mês atual). */
export function billingEntriesScope(params: UrlParams): BillingEntriesScope {
  return { ...condominiumScope(params), month: monthParam(params.get("month")) ?? currentMonthIso() };
}

const withScope = (path: string, scope: BillingEntriesScope): string => scopeUrl(path, scope);

export const billingEntriesUrl = (scope: BillingEntriesScope) => withScope("/billing/entries", scope);
export const newBillingEntryUrl = (scope: BillingEntriesScope) => withScope("/billing/entries/new", scope);
export const billingEntryUrl = (entryId: string, scope: BillingEntriesScope) => withScope(`/billing/entries/${entryId}`, scope);

export interface BillingEntriesFrameState {
  /** A coluna da lista só envolve as telas da inclusão de valores: a vazia (a grade do mês), o lançamento novo e o aberto. */
  hasFrame: boolean;
  entryId: string | null;
  isNew: boolean;
  /** No celular a lista e o lançamento aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/billing/entries` (a vazia), `/billing/entries/new` e `/billing/entries/[entryId]`. */
export function billingEntriesFrameState(pathname: string | null): BillingEntriesFrameState {
  const { id, ...frame } = registryFrame(pathname, "billing", "entries");
  return { ...frame, entryId: id };
}
