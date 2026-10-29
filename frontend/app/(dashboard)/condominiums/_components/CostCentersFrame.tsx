"use client";

import { usePathname } from "next/navigation";

import { useCostCentersRetrieve } from "@/lib/api/generated";
import { costCentersFrameState } from "@/lib/cost-center-workspace";
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

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <CostCentersList
        condominiumId={state.condominiumId ?? costCenter?.condominium ?? null}
        openCostCenterId={state.costCenterId}
        className="hidden lg:flex"
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
