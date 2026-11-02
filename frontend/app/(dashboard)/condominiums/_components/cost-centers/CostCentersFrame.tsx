"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { useCostCentersRetrieve } from "@/lib/api/generated";
import { costCentersFrameState } from "@/lib/condominiums/cost-center-workspace";
import { CondominiumSideMenu } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumSideMenu";

import { CostCenterSideMenu } from "./CostCenterSideMenu";
import { CostCentersList } from "./CostCentersList";

/**
 * Client Component: a moldura do módulo de sub-contas (as sub-contas do condomínio à esquerda, a tela vazia, o cadastro ou a edição ao lado). Só
 * envolve essas telas (`costCentersFrameState`); as demais passam direto. Na edição o condomínio vem da própria sub-conta (a mesma
 * consulta que o formulário faz). No celular, a lista e a sub-conta aberta são telas separadas.
 */
export function CostCentersFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const state = costCentersFrameState(pathname, { condominium: search.get("condominium") });
  const { data: costCenter } = useCostCentersRetrieve(state.costCenterId ?? "", { query: { enabled: Boolean(state.costCenterId) } });
  if (!state.hasFrame) return <>{children}</>;

  // O menu da direita é desta moldura (layout): o da sub-conta na edição, o do condomínio (com Sub-contas aberto) no cadastro; a tela vazia não tem.
  const aside = state.costCenterId ? (
    <CostCenterSideMenu costCenterId={state.costCenterId} />
  ) : state.condominiumId ? (
    <CondominiumSideMenu condominiumId={state.condominiumId} current="cost-centers" />
  ) : undefined;

  return (
    <RegistryFrame
      list={(className) => (
        <Suspense fallback={null}>
          <CostCentersList condominiumId={state.condominiumId ?? costCenter?.condominium ?? null} openCostCenterId={state.costCenterId} isNew={state.isNew} className={className} />
        </Suspense>
      )}
      aside={aside}
      showListOnPhone={state.showListOnPhone}
      showPageOnPhone={state.showPageOnPhone}
    >
      {children}
    </RegistryFrame>
  );
}
