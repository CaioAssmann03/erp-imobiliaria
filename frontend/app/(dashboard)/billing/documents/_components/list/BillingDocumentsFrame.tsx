"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_DOCUMENT_SECTIONS, billingDocumentsFrameState } from "@/lib/billing/billing-document-workspace";
import { cn } from "@/lib/utils";

import { BillingDocumentsList } from "./BillingDocumentsList";

/**
 * Client Component: a moldura dos documentos de cobrança, as 3 colunas das telas do cadastro: a lista à esquerda, o documento aberto no meio e o índice de seções
 * à direita (a lista e o índice são desta moldura, por isso continuam montados ao trocar de documento). A tela vazia ocupa a largura toda. No celular, a lista e o
 * documento são telas separadas.
 */
export function BillingDocumentsFrame({ children }: { children: React.ReactNode }) {
  const state = billingDocumentsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <BillingDocumentsList openDocumentId={state.documentId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {state.documentId !== null ? (
          <FormPage aside={<SectionIndex sections={BILLING_DOCUMENT_SECTIONS} label="Seções do documento" title="Neste documento" />}>{children}</FormPage>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
