"use client";

import { useSearchParams } from "next/navigation";

import { billingPlansScope, type BillingPlansScope } from "@/lib/billing/billing-plan-workspace";

/** O condomínio que a lista, o formulário e o plano aberto seguem, lido da URL (a lista da moldura o troca; vazio = todos). */
export function usePlansScope(): BillingPlansScope {
  return billingPlansScope(useSearchParams());
}
