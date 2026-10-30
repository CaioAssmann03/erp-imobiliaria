"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getCostCentersListQueryKey, useCostCentersDestroy } from "@/lib/api/generated";
import { condominiumPageUrl } from "@/lib/condominium-registry";
import { applyServerErrors } from "@/lib/form-errors";
import { toast } from "@/lib/toast";

/** Client Component: exclui a sub-conta aberta (confirmação) e volta à tela de sub-contas do condomínio. Com modelos de lançamento vinculados o backend recusa (desative em vez de excluir). */
export function CostCenterDeleteButton({ condominiumId, costCenterId, name }: { condominiumId: string; costCenterId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useCostCentersDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: costCenterId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getCostCentersListQueryKey() });
          toast.success("Sub-conta excluída.");
          router.push(condominiumPageUrl(condominiumId, "cost-centers"));
        },
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir sub-conta?"
      description={`A sub-conta "${name}" será excluída. Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
