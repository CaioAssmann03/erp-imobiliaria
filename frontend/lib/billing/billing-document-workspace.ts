/** Seções da página de um documento de cobrança, na ordem em que aparecem; o índice da direita usa estes ids (a do Boleto extra também). */
export const BILLING_DOCUMENT_SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "boleto", label: "Boleto" },
  { id: "itens", label: "Itens" },
  { id: "condicoes", label: "Condições" },
] as const;

/** O escopo da lista: o condomínio (obrigatório: sem ele a lista não mostra nada) e o mês de referência (primeiro dia, "2026-10-01"; vazio = todos os meses). Viaja na URL (`?condominium=&reference_month=`). */
export interface BillingDocumentsScope {
  condominium: string;
  month: string;
}

// Sem importar `uuidParam`: este módulo é testado direto pelo Node, que não resolve os imports sem extensão do projeto.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])-01$/;

/** O escopo lido da URL: só um UUID vale como condomínio e só um primeiro dia de mês como mês (o link das Execuções já usa estes nomes). */
export function billingDocumentsScope(params: { get: (name: string) => string | null }): BillingDocumentsScope {
  const condominium = params.get("condominium") ?? "";
  const month = params.get("reference_month") ?? "";
  return { condominium: UUID.test(condominium) ? condominium : "", month: MONTH.test(month) ? month : "" };
}

const withScope = (path: string, scope: BillingDocumentsScope): string => {
  const query = new URLSearchParams();
  if (scope.condominium) query.set("condominium", scope.condominium);
  if (scope.month) query.set("reference_month", scope.month);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
};

export const billingDocumentsUrl = (scope: BillingDocumentsScope) => withScope("/billing/documents", scope);
export const billingDocumentUrl = (documentId: string, scope: BillingDocumentsScope) => withScope(`/billing/documents/${documentId}`, scope);

export interface BillingDocumentsFrameState {
  /** A coluna da lista envolve as telas dos documentos: a vazia e o documento aberto (um documento não se cadastra: não há tela de novo). */
  hasFrame: boolean;
  documentId: string | null;
  /** No celular a lista e o documento aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/billing/documents` (a vazia) e `/billing/documents/[documentId]`. */
export function billingDocumentsFrameState(pathname: string | null): BillingDocumentsFrameState {
  const none: BillingDocumentsFrameState = { hasFrame: false, documentId: null, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "billing" || second !== "documents" || extra !== undefined) return none;

  if (third === undefined || third === "") return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  return { ...none, hasFrame: true, documentId: third };
}
