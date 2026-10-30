/** Seções da página de um boleto extra novo, na ordem em que aparecem; o índice da direita usa estes ids. */
export const NEW_EXTRA_BILLING_SECTIONS = [
  { id: "boleto", label: "Boleto" },
  { id: "unidades", label: "Unidades" },
  { id: "valores", label: "Valores" },
] as const;

/** O escopo da lista: o condomínio de que se veem (e se emitem) os boletos extras. Viaja na URL. */
export interface ExtraBillingScope {
  condominium: string;
}

// Sem importar `uuidParam`: este módulo é testado direto pelo Node, que não resolve os imports sem extensão do projeto.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O escopo lido da URL: só um UUID vale como condomínio. */
export function extraBillingScope(params: { get: (name: string) => string | null }): ExtraBillingScope {
  return { condominium: UUID.test(params.get("condominium") ?? "") ? (params.get("condominium") as string) : "" };
}

const withScope = (path: string, scope: ExtraBillingScope): string => (scope.condominium ? `${path}?condominium=${scope.condominium}` : path);

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
  const none: ExtraBillingFrameState = { hasFrame: false, documentId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "billing" || second !== "extra" || extra !== undefined) return none;

  if (third === undefined || third === "") return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, documentId: third };
}
