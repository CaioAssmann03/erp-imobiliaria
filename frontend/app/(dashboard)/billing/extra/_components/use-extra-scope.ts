"use client";

import { useUrlScope } from "@/hooks/use-url-scope";
import { extraBillingScope, type ExtraBillingScope } from "@/lib/billing/extra-billing-workspace";

/** O condomínio que a lista, o formulário e o boleto aberto mostram, lido da URL (a lista da moldura o troca, as telas o seguem). */
export const useExtraScope = (): ExtraBillingScope => useUrlScope(extraBillingScope);
