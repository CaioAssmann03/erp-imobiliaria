"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { unitsFrameState } from "@/lib/unit-workspace";
import { cn } from "@/lib/utils";
import { UnitsList } from "./UnitsList";

/**
 * Client Component: a moldura do cadastro de unidades (condomínio e lista de unidades à esquerda, a unidade aberta ao lado).
 * Só envolve as telas do cadastro (`unitsFrameState`); a tabela de pendências (`?pending=`) ocupa a largura toda.
 * No celular, a lista e a unidade aberta são telas separadas.
 */
export function UnitsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const state = unitsFrameState(pathname, { condominium: search.get("condominium"), pending: search.get("pending") });
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <UnitsList
        condominiumId={state.condominiumId}
        openUnitId={state.unitId}
        className={state.showListOnPhone ? "flex" : "hidden lg:flex"}
      />
      <div className={cn("min-w-0 flex-1", !state.showPageOnPhone && "hidden lg:block")}>{children}</div>
    </div>
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
