"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getBlocksListQueryKey, getUnitsListQueryKey, useBlocksDestroy } from "@/lib/api/generated";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";

/** Client Component: exclui o bloco aberto (confirmação) e volta à tela de blocos do condomínio. */
export function BlockDeleteButton({ condominiumId, blockId, name }: { condominiumId: string; blockId: string; name: string }) {
  const destroyMutation = useBlocksDestroy();

  return (
    <RecordDeleteButton
      title="Excluir bloco?"
      description={`O bloco "${name}" será excluído. Esta ação não pode ser desfeita.`}
      destroy={(options) => destroyMutation.mutate({ id: blockId }, options)}
      invalidate={[getBlocksListQueryKey(), getUnitsListQueryKey()]}
      success="Bloco excluído."
      failure="Não foi possível excluir o bloco."
      redirectTo={condominiumPageUrl(condominiumId, "blocks")}
    />
  );
}
