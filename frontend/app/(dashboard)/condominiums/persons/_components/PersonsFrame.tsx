"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { FormPage } from "@/components/form/FormPage";
import { SectionIndex } from "@/components/SectionIndex";
import { PERSON_SECTIONS, personsFrameState } from "@/lib/person-workspace";
import { cn } from "@/lib/utils";
import { PersonsList } from "./PersonsList";

/**
 * Client Component: a moldura do cadastro de pessoas (a lista à esquerda, a pessoa aberta ao lado, o índice de seções à direita, como em
 * condomínios). Só envolve as telas do cadastro (`personsFrameState`). No celular, a lista e a pessoa aberta são telas separadas.
 */
export function PersonsFrame({ children }: { children: React.ReactNode }) {
  const state = personsFrameState(usePathname());
  if (!state.hasFrame) return <>{children}</>;

  // O índice da direita é desta moldura (layout): só na pessoa aberta e no cadastro novo; a tela vazia ocupa a largura toda.
  const hasPerson = state.isNew || state.personId !== null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      {/* A lista lê `?condominium=` (o condomínio de onde se chegou): precisa do limite de Suspense. */}
      <Suspense fallback={null}>
        <PersonsList openPersonId={state.personId} className={state.showListOnPhone ? "flex" : "hidden lg:flex"} />
      </Suspense>
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>{hasPerson ? (
          <FormPage aside={<SectionIndex sections={PERSON_SECTIONS} label="Seções da pessoa" title="Nesta pessoa" />}>{children}</FormPage>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
