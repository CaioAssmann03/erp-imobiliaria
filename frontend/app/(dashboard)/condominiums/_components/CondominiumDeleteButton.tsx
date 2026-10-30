"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  getCondominiumsListQueryKey,
  getDashboardRetrieveQueryKey,
  useCondominiumsDestroy,
} from "@/lib/api/generated";
import { toast } from "@/lib/toast";

/** Client Component: exclui o condomínio aberto (confirmação) e volta à tela vazia do cadastro. */
export function CondominiumDeleteButton({ condominiumId, name }: { condominiumId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useCondominiumsDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: condominiumId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getCondominiumsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Condomínio excluído.");
          router.push("/condominiums");
        },
        onError: () => toast.error("Não foi possível excluir o condomínio."),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir condomínio?"
      description={`O condomínio "${name}" será excluído. Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
