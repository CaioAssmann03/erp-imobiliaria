"use client";

import { useUrlScope } from "@/hooks/use-url-scope";
import { billingEntriesScope, type BillingEntriesScope } from "@/lib/billing/billing-entry-workspace";

/** O condomínio e o mês que a lista, a grade e o detalhe mostram, lidos da URL (a lista da moldura os troca, as telas os seguem). */
export const useEntriesScope = (): BillingEntriesScope => useUrlScope(billingEntriesScope);
