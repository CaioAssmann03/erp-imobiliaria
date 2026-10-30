"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { BILLING_DOCUMENT_SECTIONS } from "@/lib/billing/billing-document-workspace";
import { NEW_EXTRA_BILLING_SECTIONS, extraBillingFrameState } from "@/lib/billing/extra-billing-workspace";
import { cn } from "@/lib/utils";

import { ExtraBillingList } from "./ExtraBillingList";

/**
 * Client Component: a moldura do boleto extra, as 3 colunas das telas do cadastro: a lista dos boletos extras emitidos à esquerda, o boleto novo (ou o
 * emitido aberto) no meio e o índice de seções à direita (a lista e o índice são desta moldura, por isso continuam montados ao trocar
 * de boleto). A tela vazia ocupa a largura toda. No celular, a lista e o boleto são telas separadas.
 */
export function ExtraBillingFrame({ children }: { children: React.ReactNode }) {
  const state = extraBillingFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasPage = state.isNew || state.documentId !== null;
  const sections = state.isNew ? NEW_EXTRA_BILLING_SECTIONS : BILLING_DOCUMENT_SECTIONS;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <ExtraBillingList openDocumentId={state.documentId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>{hasPage ? <FormPage aside={<SectionIndex sections={sections} label="Seções do boleto extra" title="Neste boleto" />}>{children}</FormPage> : children}</div>
    </div>
  );
}
