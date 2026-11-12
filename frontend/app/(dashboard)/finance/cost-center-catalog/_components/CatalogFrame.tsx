"use client";

import { usePathname } from "next/navigation";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { catalogFrameState, catalogSections } from "@/lib/finance/cost-center-catalog-workspace";

import { CatalogList } from "./CatalogList";

/** Client Component: a moldura do catálogo de sub-contas: a lista, a sub-conta aberta e o índice de seções (`catalogFrameState`); a tela vazia ocupa a largura toda. */
export function CatalogFrame({ children }: { children: React.ReactNode }) {
  const state = catalogFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<CatalogList openItemId={state.itemId} className={className} />)}
      aside={state.isNew || state.itemId !== null ? <SectionIndex sections={catalogSections(state.isNew)} label="Seções da sub-conta" title="Nesta sub-conta" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
