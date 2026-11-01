"use client";

import { useUrlScope } from "@/hooks/use-url-scope";
import { billingPlansScope, type BillingPlansScope } from "@/lib/billing/billing-plan-workspace";

/** O condomínio que a lista, o formulário e o plano aberto seguem, lido da URL (a lista da moldura o troca; vazio = todos). */
export const usePlansScope = (): BillingPlansScope => useUrlScope(billingPlansScope);
