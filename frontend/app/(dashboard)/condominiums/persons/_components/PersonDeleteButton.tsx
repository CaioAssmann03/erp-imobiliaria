"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getDashboardRetrieveQueryKey, getPersonsListQueryKey, usePersonsDestroy } from "@/lib/api/generated";
import { personsUrl } from "@/lib/persons/person-workspace";
import { toast } from "@/lib/errors/toast";

/** Client Component: exclui a pessoa aberta (confirmação) e volta à tela de pessoas, sem ninguém aberta. */
export function PersonDeleteButton({ personId, name }: { personId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = usePersonsDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: personId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getPersonsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          toast.success("Pessoa excluída.");
          router.push(personsUrl());
        },
        onError: () => toast.error("Não foi possível excluir a pessoa."),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir pessoa?"
      description={`"${name}" será excluída. Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
