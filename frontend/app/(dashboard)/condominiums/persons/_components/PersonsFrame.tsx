"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { PERSON_SECTIONS, personsFrameState } from "@/lib/persons/person-workspace";

import { PersonsList } from "./PersonsList";

/** Client Component: a moldura do cadastro de pessoas: a lista, a pessoa aberta e o índice de seções (`personsFrameState`); a tela vazia ocupa a largura toda. A lista lê `?condominium=` (o condomínio de onde se chegou) e por isso precisa do limite de `Suspense`. */
export function PersonsFrame({ children }: { children: React.ReactNode }) {
  const state = personsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  return (
    <RegistryFrame
      list={(className) => (<Suspense fallback={null}>
          <PersonsList openPersonId={state.personId} className={className} />
        </Suspense>)}
      aside={state.isNew || state.personId !== null ? <SectionIndex sections={PERSON_SECTIONS} label="Seções da pessoa" title="Nesta pessoa" /> : undefined}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
