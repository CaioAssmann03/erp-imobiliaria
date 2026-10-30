/** Seções da página de uma execução da emissão, na ordem em que aparecem; o índice da direita usa estes ids. */
export const BILLING_RUN_SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "problemas", label: "Problemas" },
] as const;

/** O escopo da lista: o condomínio (obrigatório: sem ele a lista não mostra nada) e o mês de referência (primeiro dia, "2026-10-01"; vazio = todos os meses). Viaja na URL. */
export interface BillingRunsScope {
  condominium: string;
  month: string;
}

// Sem importar `uuidParam`: este módulo é testado direto pelo Node, que não resolve os imports sem extensão do projeto.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])-01$/;

/** O escopo lido da URL (`?condominium=&reference_month=`): só um UUID vale como condomínio e só um primeiro dia de mês como mês. */
export function billingRunsScope(params: { get: (name: string) => string | null }): BillingRunsScope {
  const condominium = params.get("condominium") ?? "";
  const month = params.get("reference_month") ?? "";
  return { condominium: UUID.test(condominium) ? condominium : "", month: MONTH.test(month) ? month : "" };
}

const withScope = (path: string, scope: BillingRunsScope): string => {
  const query = new URLSearchParams();
  if (scope.condominium) query.set("condominium", scope.condominium);
  if (scope.month) query.set("reference_month", scope.month);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
};

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
  const none: BillingRunsFrameState = { hasFrame: false, runId: null, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "billing" || second !== "runs" || extra !== undefined) return none;

  if (third === undefined || third === "") return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  return { ...none, hasFrame: true, runId: third };
}
