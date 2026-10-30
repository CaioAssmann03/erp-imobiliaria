"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { COMPANY_ENTRY_SECTIONS, companyAccountFrameState } from "@/lib/company-account-workspace";
import { cn } from "@/lib/utils";

import { CompanyEntriesList } from "./CompanyEntriesList";

/**
 * Client Component: a moldura da conta da imobiliária, as 3 colunas das telas do cadastro: a lista de lançamentos à esquerda, o lançamento aberto no
 * meio e o índice de seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de lançamento). Só envolve as telas da
 * conta (`companyAccountFrameState`); a tela vazia, com o saldo, ocupa a largura toda. No celular, a lista e o lançamento são telas separadas.
 */
export function CompanyAccountFrame({ children }: { children: React.ReactNode }) {
  const state = companyAccountFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <CompanyEntriesList openEntryId={state.entryId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {state.entryId ? <FormPage aside={<SectionIndex sections={COMPANY_ENTRY_SECTIONS} label="Seções do lançamento" title="Neste lançamento" />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
