"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_PLAN_SECTIONS, billingPlansFrameState } from "@/lib/billing/billing-plan-workspace";
import { cn } from "@/lib/utils";

import { BillingPlansList } from "./BillingPlansList";

/**
 * Client Component: a moldura dos planos de cobrança, as 3 colunas das telas do cadastro: a lista dos planos à esquerda, o plano novo (ou o aberto) no meio e o
 * índice de seções à direita (a lista e o índice são desta moldura, por isso continuam montados ao trocar de plano). A tela vazia ocupa a largura toda. No
 * celular, a lista e o plano são telas separadas.
 */
export function BillingPlansFrame({ children }: { children: React.ReactNode }) {
  const state = billingPlansFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasPage = state.isNew || state.planId !== null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <BillingPlansList openPlanId={state.planId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {hasPage ? <FormPage aside={<SectionIndex sections={BILLING_PLAN_SECTIONS} label="Seções do plano" title="Neste plano" />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
