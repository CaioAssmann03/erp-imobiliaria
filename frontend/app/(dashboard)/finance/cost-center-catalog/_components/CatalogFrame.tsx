"use client";

import { usePathname } from "next/navigation";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { catalogFrameState, catalogSections } from "@/lib/cost-center-catalog-workspace";
import { cn } from "@/lib/utils";

import { CatalogList } from "./CatalogList";

/**
 * Client Component: a moldura do catálogo de sub-contas, as 3 colunas das telas do cadastro: a lista à esquerda, a sub-conta aberta no meio e o
 * índice de seções à direita (os dois são desta moldura, por isso continuam montados ao trocar de sub-conta). Só envolve as telas do catálogo
 * (`catalogFrameState`); a tela vazia ocupa a largura toda. No celular, a lista e a sub-conta aberta são telas separadas.
 */
export function CatalogFrame({ children }: { children: React.ReactNode }) {
  const state = catalogFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  const hasItem = state.isNew || state.itemId !== null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <CatalogList openItemId={state.itemId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>
        {hasItem ? <FormPage aside={<SectionIndex sections={catalogSections(state.isNew)} label="Seções da sub-conta" title="Nesta sub-conta" />}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
