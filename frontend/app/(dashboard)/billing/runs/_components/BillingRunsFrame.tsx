"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_RUN_SECTIONS, billingRunsFrameState } from "@/lib/billing/billing-run-workspace";
import { cn } from "@/lib/utils";

import { BillingRunsList } from "./BillingRunsList";

/**
 * Client Component: a moldura das execuções da emissão, as 3 colunas das telas do cadastro: a lista à esquerda, a execução aberta no meio e o índice de seções à
 * direita (a lista e o índice são desta moldura, por isso continuam montados ao trocar de execução). A tela vazia ocupa a largura toda. No celular, a lista e a
 * execução são telas separadas.
 */
export function BillingRunsFrame({ children }: { children: React.ReactNode }) {
  const state = billingRunsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <BillingRunsList openRunId={state.runId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {state.runId !== null ? (
          <FormPage aside={<SectionIndex sections={BILLING_RUN_SECTIONS} label="Seções da execução" title="Nesta execução" />}>{children}</FormPage>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
