import { registryFrame } from "../navigation/registry-frame.ts";
import { condominiumScope, scopeUrl, type CondominiumScope } from "../navigation/url-scope.ts";

/** Seções da página de um plano (novo ou aberto), na ordem em que aparecem; o índice da direita usa estes ids. */
export const BILLING_PLAN_SECTIONS = [
  { id: "plano", label: "Plano" },
  { id: "itens", label: "Itens" },
] as const;

/** O escopo da lista: o condomínio de que se veem os planos ("" = todos). Viaja na URL. */
export type BillingPlansScope = CondominiumScope;

/** O escopo lido da URL: só um UUID vale como condomínio. */
export const billingPlansScope = condominiumScope;

const withScope = (path: string, scope: BillingPlansScope): string => scopeUrl(path, scope);

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
  const { id, ...frame } = registryFrame(pathname, "billing", "plans");
  return { ...frame, planId: id };
}
