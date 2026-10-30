"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { BILLING_ENTRY_SECTIONS, NEW_BILLING_ENTRY_SECTIONS, billingEntriesFrameState } from "@/lib/billing-entry-workspace";
import { cn } from "@/lib/utils";

import { BillingEntriesList } from "./BillingEntriesList";

/**
 * Client Component: a moldura da inclusão de valores, as 3 colunas das telas do cadastro: a lista dos lançamentos do mês à esquerda, o lançamento
 * aberto (ou o novo) no meio e o índice de seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de lançamento). Só
 * envolve as telas da inclusão (`billingEntriesFrameState`); a tela vazia, a grade do mês, ocupa a largura toda. No celular, a lista e o
 * lançamento são telas separadas.
 */
export function BillingEntriesFrame({ children }: { children: React.ReactNode }) {
  const state = billingEntriesFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasEntry = state.isNew || state.entryId !== null;
  const sections = state.isNew ? NEW_BILLING_ENTRY_SECTIONS : BILLING_ENTRY_SECTIONS;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <BillingEntriesList openEntryId={state.entryId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {hasEntry ? <FormPage aside={<SectionIndex sections={sections} label="Seções do lançamento" title="Neste lançamento" />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
