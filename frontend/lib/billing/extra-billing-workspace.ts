import { registryFrame } from "../navigation/registry-frame.ts";
import { condominiumScope, scopeUrl, type CondominiumScope } from "../navigation/url-scope.ts";

/** Seções da página de um boleto extra novo, na ordem em que aparecem; o índice da direita usa estes ids. */
export const NEW_EXTRA_BILLING_SECTIONS = [
  { id: "boleto", label: "Boleto" },
  { id: "unidades", label: "Unidades" },
  { id: "valores", label: "Valores" },
] as const;

/** O escopo da lista: o condomínio de que se veem (e se emitem) os boletos extras. Viaja na URL. */
export type ExtraBillingScope = CondominiumScope;

/** O escopo lido da URL: só um UUID vale como condomínio. */
export const extraBillingScope = condominiumScope;

const withScope = (path: string, scope: ExtraBillingScope): string => scopeUrl(path, scope);

export const extraBillingUrl = (scope: ExtraBillingScope) => withScope("/billing/extra", scope);
export const newExtraBillingUrl = (scope: ExtraBillingScope) => withScope("/billing/extra/new", scope);
export const extraBillingDocumentUrl = (documentId: string, scope: ExtraBillingScope) => withScope(`/billing/extra/${documentId}`, scope);

export interface ExtraBillingFrameState {
  /** A coluna da lista só envolve as telas do boleto extra: a vazia, o boleto novo e o emitido aberto. */
  hasFrame: boolean;
  documentId: string | null;
  isNew: boolean;
  /** No celular a lista e o boleto aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/billing/extra` (a vazia), `/billing/extra/new` e `/billing/extra/[documentId]`. */
export function extraBillingFrameState(pathname: string | null): ExtraBillingFrameState {
  const { id, ...frame } = registryFrame(pathname, "billing", "extra");
  return { ...frame, documentId: id };
}
