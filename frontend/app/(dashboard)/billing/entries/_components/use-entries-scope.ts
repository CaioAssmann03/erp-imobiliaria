"use client";

import { useSearchParams } from "next/navigation";

import { billingEntriesScope, type BillingEntriesScope } from "@/lib/billing-entry-workspace";

/** O condomínio e o mês que a lista, a grade e o detalhe mostram, lidos da URL (a lista da moldura os troca, as telas os seguem). */
export function useEntriesScope(): BillingEntriesScope {
  return billingEntriesScope(useSearchParams());
}
