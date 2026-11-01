"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { COMPANY_ENTRY_SECTIONS, companyAccountFrameState } from "@/lib/finance/company-account-workspace";

import { CompanyEntriesList } from "./CompanyEntriesList";

/** Client Component: a moldura da conta da imobiliária: a lista de lançamentos, o lançamento aberto e o índice de seções (`companyAccountFrameState`); a tela vazia, com o saldo, ocupa a largura toda. */
export function CompanyAccountFrame({ children }: { children: React.ReactNode }) {
  const state = companyAccountFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<CompanyEntriesList openEntryId={state.entryId} className={className} />)}
      aside={state.entryId ? <SectionIndex sections={COMPANY_ENTRY_SECTIONS} label="Seções do lançamento" title="Neste lançamento" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
