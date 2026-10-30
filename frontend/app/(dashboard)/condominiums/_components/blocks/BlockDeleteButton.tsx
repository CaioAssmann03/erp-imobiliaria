"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getBlocksListQueryKey, getUnitsListQueryKey, useBlocksDestroy } from "@/lib/api/generated";
import { condominiumPageUrl } from "@/lib/condominium-registry";
import { toast } from "@/lib/toast";

/** Client Component: exclui o bloco aberto (confirmação) e volta à tela de blocos do condomínio. */
export function BlockDeleteButton({ condominiumId, blockId, name }: { condominiumId: string; blockId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useBlocksDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: blockId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBlocksListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() });
          toast.success("Bloco excluído.");
          router.push(condominiumPageUrl(condominiumId, "blocks"));
        },
        onError: () => toast.error("Não foi possível excluir o bloco."),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir bloco?"
      description={`O bloco "${name}" será excluído. Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
