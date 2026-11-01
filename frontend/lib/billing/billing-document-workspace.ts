import { registryFrame } from "../navigation/registry-frame.ts";
import { condominiumMonthScope, monthScopeUrl, type CondominiumMonthScope } from "../navigation/url-scope.ts";

/** Seções da página de um documento de cobrança, na ordem em que aparecem; o índice da direita usa estes ids (a do Boleto extra também). */
export const BILLING_DOCUMENT_SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "boleto", label: "Boleto" },
  { id: "itens", label: "Itens" },
  { id: "condicoes", label: "Condições" },
] as const;

/** O escopo da lista: o condomínio (obrigatório: sem ele a lista não mostra nada) e o mês de referência (primeiro dia, "2026-10-01"; vazio = todos os meses). Viaja na URL (`?condominium=&reference_month=`). */
export type BillingDocumentsScope = CondominiumMonthScope;

/** O escopo lido da URL: só um UUID vale como condomínio e só um primeiro dia de mês como mês (o link das Execuções já usa estes nomes). */
export const billingDocumentsScope = condominiumMonthScope;

const withScope = monthScopeUrl;

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
  const { hasFrame, id, showListOnPhone, showPageOnPhone } = registryFrame(pathname, "billing", "documents", false);
  return { hasFrame, documentId: id, showListOnPhone, showPageOnPhone };
}
