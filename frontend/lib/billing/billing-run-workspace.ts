import { registryFrame } from "../navigation/registry-frame.ts";
import { condominiumMonthScope, monthScopeUrl, type CondominiumMonthScope } from "../navigation/url-scope.ts";

/** Seções da página de uma execução da emissão, na ordem em que aparecem; o índice da direita usa estes ids. */
export const BILLING_RUN_SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "problemas", label: "Problemas" },
] as const;

/** O escopo da lista: o condomínio (obrigatório: sem ele a lista não mostra nada) e o mês de referência (primeiro dia, "2026-10-01"; vazio = todos os meses). Viaja na URL. */
export type BillingRunsScope = CondominiumMonthScope;

/** O escopo lido da URL (`?condominium=&reference_month=`): só um UUID vale como condomínio e só um primeiro dia de mês como mês. */
export const billingRunsScope = condominiumMonthScope;

const withScope = monthScopeUrl;

export const billingRunsUrl = (scope: BillingRunsScope) => withScope("/billing/runs", scope);
export const billingRunUrl = (runId: string, scope: BillingRunsScope) => withScope(`/billing/runs/${runId}`, scope);

export interface BillingRunsFrameState {
  /** A coluna da lista envolve as telas das execuções: a vazia e a execução aberta (uma execução se cria pelo **+**, que abre um diálogo, não uma tela). */
  hasFrame: boolean;
  runId: string | null;
  /** No celular a lista e a execução aberta são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/billing/runs` (a vazia) e `/billing/runs/[runId]`. */
export function billingRunsFrameState(pathname: string | null): BillingRunsFrameState {
  const { hasFrame, id, showListOnPhone, showPageOnPhone } = registryFrame(pathname, "billing", "runs", false);
  return { hasFrame, runId: id, showListOnPhone, showPageOnPhone };
}
