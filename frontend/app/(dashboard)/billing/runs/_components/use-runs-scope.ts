"use client";

import { useUrlScope } from "@/hooks/use-url-scope";
import { billingRunsScope, type BillingRunsScope } from "@/lib/billing/billing-run-workspace";

/** O condomínio e o mês de referência que a lista e a execução aberta seguem, lidos da URL (a lista da moldura os troca). */
export const useRunsScope = (): BillingRunsScope => useUrlScope(billingRunsScope);
