"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { UNIT_SECTIONS, unitsFrameState } from "@/lib/condominiums/unit-workspace";

import { UnitSideMenu } from "./UnitSideMenu";
import { UnitsList } from "./UnitsList";

/**
 * Client Component: a moldura do cadastro de unidades (condomínio e lista de unidades à esquerda, a unidade aberta ao lado).
 * Só envolve as telas do cadastro (`unitsFrameState`); com `?pending=` (as Pendências do painel) a lista abre filtrada, de todos os condomínios.
 * No celular, a lista e a unidade aberta são telas separadas.
 */
export function UnitsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const state = unitsFrameState(pathname, { condominium: search.get("condominium") });
  if (!state.hasFrame) return <>{children}</>;

  // O menu da direita é desta moldura (layout): o da unidade aberta (seções e pessoas) ou o das seções no cadastro novo; a tela vazia e a nova unidade ainda sem condomínio não têm.
  const aside = state.unitId ? (
    <UnitSideMenu unitId={state.unitId} current={state.subScreen} />
  ) : state.isNew && state.condominiumId ? (
    <SectionIndex sections={UNIT_SECTIONS} label="Seções da unidade" title="Nesta unidade" />
  ) : undefined;

  return (
    <RegistryFrame
      list={(className) => <UnitsList condominiumId={state.condominiumId} openUnitId={state.unitId} isNew={state.isNew} className={className} />}
      aside={aside}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}

/** `useSearchParams` precisa de um limite de Suspense para a página poder ser prerenderizada. */
export function UnitsFrameBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <UnitsFrame>{children}</UnitsFrame>
    </Suspense>
  );
}
