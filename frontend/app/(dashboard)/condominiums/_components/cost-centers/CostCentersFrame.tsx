"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { FormPage } from "@/components/form/FormPage";
import { useCostCentersRetrieve } from "@/lib/api/generated";
import { costCentersFrameState } from "@/lib/cost-center-workspace";
import { CondominiumSideMenu } from "./CondominiumSideMenu";
import { CostCenterSideMenu } from "./CostCenterSideMenu";
import { CostCentersList } from "./CostCentersList";

/**
 * Client Component: a moldura do cadastro e da edição de uma sub-conta (as sub-contas do condomínio à esquerda, o formulário ao lado). Só
 * envolve essas duas telas (`costCentersFrameState`); as demais passam direto. Na edição o condomínio vem da própria sub-conta (a mesma
 * consulta que o formulário faz). No celular só o formulário aparece.
 */
export function CostCentersFrame({ children }: { children: React.ReactNode }) {
  const state = costCentersFrameState(usePathname());
  const { data: costCenter } = useCostCentersRetrieve(state.costCenterId ?? "", { query: { enabled: Boolean(state.costCenterId) } });
  if (!state.hasFrame) return <>{children}</>;

  // O menu da direita é desta moldura (layout): o da sub-conta na edição, o do condomínio (com Sub-contas aberto) no cadastro.
  const aside = state.costCenterId ? (
    <CostCenterSideMenu costCenterId={state.costCenterId} />
  ) : state.condominiumId ? (
    <CondominiumSideMenu condominiumId={state.condominiumId} current="cost-centers" />
  ) : null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <Suspense fallback={null}>
        <CostCentersList
          condominiumId={state.condominiumId ?? costCenter?.condominium ?? null}
          openCostCenterId={state.costCenterId}
          className="hidden lg:flex"
        />
      </Suspense>
      <div className="min-w-0 flex-1">{aside ? <FormPage aside={aside}>{children}</FormPage> : children}</div>
    </div>
  );
}
