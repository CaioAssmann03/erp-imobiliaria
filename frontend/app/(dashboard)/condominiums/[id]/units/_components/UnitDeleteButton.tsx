"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getDashboardRetrieveQueryKey, getUnitsListQueryKey, useUnitsDestroy } from "@/lib/api/generated";
import { invalidateApportionment } from "@/lib/query/apportionment";
import { unitsUrl } from "@/lib/unit-workspace";

/** Client Component: exclui a unidade aberta (confirmação) e volta à lista de unidades do condomínio. */
export function UnitDeleteButton({ condominiumId, unitId, name }: { condominiumId: string; unitId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useUnitsDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: unitId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          invalidateApportionment(queryClient);
          toast.success("Unidade excluída.");
          router.push(unitsUrl(condominiumId));
        },
        onError: () => toast.error("Não foi possível excluir a unidade."),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir unidade?"
      description={`A unidade "${name}" será excluída. Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
