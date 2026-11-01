"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_RUN_SECTIONS, billingRunsFrameState } from "@/lib/billing/billing-run-workspace";

import { BillingRunsList } from "./BillingRunsList";

/** Client Component: a moldura das execuções da emissão: a lista, a execução aberta e o índice de seções (`billingRunsFrameState`); a tela vazia ocupa a largura toda. */
export function BillingRunsFrame({ children }: { children: React.ReactNode }) {
  const state = billingRunsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<BillingRunsList openRunId={state.runId} className={className} />)}
      aside={state.runId !== null ? <SectionIndex sections={BILLING_RUN_SECTIONS} label="Seções da execução" title="Nesta execução" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
