"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_PLAN_SECTIONS, billingPlansFrameState } from "@/lib/billing/billing-plan-workspace";

import { BillingPlansList } from "./BillingPlansList";

/** Client Component: a moldura dos planos de cobrança: a lista, o plano novo (ou o aberto) e o índice de seções (`billingPlansFrameState`); a tela vazia ocupa a largura toda. */
export function BillingPlansFrame({ children }: { children: React.ReactNode }) {
  const state = billingPlansFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<BillingPlansList openPlanId={state.planId} className={className} />)}
      aside={state.isNew || state.planId !== null ? <SectionIndex sections={BILLING_PLAN_SECTIONS} label="Seções do plano" title="Neste plano" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
