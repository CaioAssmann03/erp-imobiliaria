"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_DOCUMENT_SECTIONS, billingDocumentsFrameState } from "@/lib/billing/billing-document-workspace";

import { BillingDocumentsList } from "./BillingDocumentsList";

/** Client Component: a moldura dos documentos de cobrança: a lista, o documento aberto e o índice de seções (`billingDocumentsFrameState`); a tela vazia ocupa a largura toda. */
export function BillingDocumentsFrame({ children }: { children: React.ReactNode }) {
  const state = billingDocumentsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<BillingDocumentsList openDocumentId={state.documentId} className={className} />)}
      aside={state.documentId !== null ? <SectionIndex sections={BILLING_DOCUMENT_SECTIONS} label="Seções do documento" title="Neste documento" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
