"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getCondominiumsListQueryKey, getDashboardRetrieveQueryKey, useCondominiumsDestroy } from "@/lib/api/generated";

/** Client Component: exclui o condomínio aberto (confirmação) e volta à tela vazia do cadastro. */
export function CondominiumDeleteButton({ condominiumId, name }: { condominiumId: string; name: string }) {
  const destroyMutation = useCondominiumsDestroy();

  return (
    <RecordDeleteButton
      title="Excluir condomínio?"
      description={`O condomínio "${name}" será excluído. Esta ação não pode ser desfeita.`}
      destroy={(options) => destroyMutation.mutate({ id: condominiumId }, options)}
      invalidate={[getCondominiumsListQueryKey(), getDashboardRetrieveQueryKey()]}
      success="Condomínio excluído."
      failure="Não foi possível excluir o condomínio."
      redirectTo="/condominiums"
    />
  );
}
