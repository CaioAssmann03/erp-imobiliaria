"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_DOCUMENT_SECTIONS } from "@/lib/billing/billing-document-workspace";
import { NEW_EXTRA_BILLING_SECTIONS, extraBillingFrameState } from "@/lib/billing/extra-billing-workspace";

import { ExtraBillingList } from "./ExtraBillingList";

/** Client Component: a moldura do boleto extra: a lista dos boletos extras emitidos, o boleto novo (ou o emitido aberto) e o índice de seções (`extraBillingFrameState`); a tela vazia ocupa a largura toda. */
export function ExtraBillingFrame({ children }: { children: React.ReactNode }) {
  const state = extraBillingFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<ExtraBillingList openDocumentId={state.documentId} className={className} />)}
      aside={state.isNew || state.documentId !== null ? <SectionIndex sections={state.isNew ? NEW_EXTRA_BILLING_SECTIONS : BILLING_DOCUMENT_SECTIONS} label="Seções do boleto extra" title="Neste boleto" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
