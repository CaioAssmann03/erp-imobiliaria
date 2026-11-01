"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getCostCentersListQueryKey, useCostCentersDestroy } from "@/lib/api/generated";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";

/** Client Component: exclui a sub-conta aberta (confirmação) e volta à tela de sub-contas do condomínio. Com modelos de lançamento vinculados o backend recusa (desative em vez de excluir). */
export function CostCenterDeleteButton({ condominiumId, costCenterId, name }: { condominiumId: string; costCenterId: string; name: string }) {
  const destroyMutation = useCostCentersDestroy();

  return (
    <RecordDeleteButton
      title="Excluir sub-conta?"
      description={`A sub-conta "${name}" será excluída. Esta ação não pode ser desfeita.`}
      destroy={(options) => destroyMutation.mutate({ id: costCenterId }, options)}
      invalidate={[getCostCentersListQueryKey()]}
      success="Sub-conta excluída."
      redirectTo={condominiumPageUrl(condominiumId, "cost-centers")}
    />
  );
}
