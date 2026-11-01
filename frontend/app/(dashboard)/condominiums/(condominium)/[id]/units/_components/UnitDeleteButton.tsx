"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getDashboardRetrieveQueryKey, getUnitsListQueryKey, useUnitsDestroy } from "@/lib/api/generated";
import { unitsUrl } from "@/lib/condominiums/unit-workspace";
import { invalidateApportionment } from "@/lib/query/apportionment";

/** Client Component: exclui a unidade aberta (confirmação) e volta à lista de unidades do condomínio. */
export function UnitDeleteButton({ condominiumId, unitId, name }: { condominiumId: string; unitId: string; name: string }) {
  const destroyMutation = useUnitsDestroy();

  return (
    <RecordDeleteButton
      title="Excluir unidade?"
      description={`A unidade "${name}" será excluída. Esta ação não pode ser desfeita.`}
      destroy={(options) => destroyMutation.mutate({ id: unitId }, options)}
      invalidate={[getUnitsListQueryKey(), getDashboardRetrieveQueryKey()]}
      onDeleted={invalidateApportionment}
      success="Unidade excluída."
      failure="Não foi possível excluir a unidade."
      redirectTo={unitsUrl(condominiumId)}
    />
  );
}
