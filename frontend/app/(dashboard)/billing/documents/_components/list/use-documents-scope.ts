"use client";

import { useSearchParams } from "next/navigation";

import { billingDocumentsScope, type BillingDocumentsScope } from "@/lib/billing/billing-document-workspace";

/** O condomínio e o mês de referência que a lista e o documento aberto seguem, lidos da URL (a lista da moldura os troca; vazios = todos). */
export function useDocumentsScope(): BillingDocumentsScope {
  return billingDocumentsScope(useSearchParams());
}
