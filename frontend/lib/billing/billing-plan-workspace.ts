/** Seções da página de um plano (novo ou aberto), na ordem em que aparecem; o índice da direita usa estes ids. */
export const BILLING_PLAN_SECTIONS = [
  { id: "plano", label: "Plano" },
  { id: "itens", label: "Itens" },
] as const;

/** O escopo da lista: o condomínio de que se veem os planos ("" = todos). Viaja na URL. */
export interface BillingPlansScope {
  condominium: string;
}

// Sem importar `uuidParam`: este módulo é testado direto pelo Node, que não resolve os imports sem extensão do projeto.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O escopo lido da URL: só um UUID vale como condomínio. */
export function billingPlansScope(params: { get: (name: string) => string | null }): BillingPlansScope {
  return { condominium: UUID.test(params.get("condominium") ?? "") ? (params.get("condominium") as string) : "" };
}

const withScope = (path: string, scope: BillingPlansScope): string => (scope.condominium ? `${path}?condominium=${scope.condominium}` : path);

export const billingPlansUrl = (scope: BillingPlansScope) => withScope("/billing/plans", scope);
export const newBillingPlanUrl = (scope: BillingPlansScope) => withScope("/billing/plans/new", scope);
export const billingPlanUrl = (planId: string, scope: BillingPlansScope) => withScope(`/billing/plans/${planId}`, scope);

export interface BillingPlansFrameState {
  /** A coluna da lista envolve as telas dos planos: a vazia, o plano novo e o aberto. */
  hasFrame: boolean;
  planId: string | null;
  isNew: boolean;
  /** No celular a lista e o plano aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/billing/plans` (a vazia), `/billing/plans/new` e `/billing/plans/[planId]`. */
export function billingPlansFrameState(pathname: string | null): BillingPlansFrameState {
  const none: BillingPlansFrameState = { hasFrame: false, planId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "billing" || second !== "plans" || extra !== undefined) return none;

  if (third === undefined || third === "") return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, planId: third };
}
