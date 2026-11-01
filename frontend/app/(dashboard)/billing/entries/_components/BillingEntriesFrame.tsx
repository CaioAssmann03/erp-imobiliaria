"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_ENTRY_SECTIONS, NEW_BILLING_ENTRY_SECTIONS, billingEntriesFrameState } from "@/lib/billing/billing-entry-workspace";

import { BillingEntriesList } from "./BillingEntriesList";

/** Client Component: a moldura da inclusão de valores: a lista dos lançamentos do mês, o lançamento aberto (ou o novo) e o índice de seções (`billingEntriesFrameState`); a tela vazia, a grade do mês, ocupa a largura toda. */
export function BillingEntriesFrame({ children }: { children: React.ReactNode }) {
  const state = billingEntriesFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<BillingEntriesList openEntryId={state.entryId} className={className} />)}
      aside={state.isNew || state.entryId !== null ? <SectionIndex sections={state.isNew ? NEW_BILLING_ENTRY_SECTIONS : BILLING_ENTRY_SECTIONS} label="Seções do lançamento" title="Neste lançamento" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
