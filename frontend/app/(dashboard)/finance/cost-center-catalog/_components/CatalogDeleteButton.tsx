"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getCostCenterCatalogListQueryKey, useCostCenterCatalogDestroy } from "@/lib/api/generated";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";

/** Client Component: exclui a sub-conta aberta (confirmação) e volta à tela do catálogo, sem nenhuma aberta. Uma que condomínios usam não sai: o backend recusa e a mensagem vem no aviso (desative em vez de excluir). */
export function CatalogDeleteButton({ itemId, name }: { itemId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useCostCenterCatalogDestroy();

  const handleDelete = () =>
    destroyMutation.mutate(
      { id: itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getCostCenterCatalogListQueryKey() });
          toast.success("Sub-conta excluída.");
          router.push(catalogUrl());
        },
        onError: (error) => toast.error(applyServerErrors(error, () => undefined)),
      }
    );

  return (
    <ConfirmDeleteButton
      title="Excluir sub-conta do catálogo?"
      description={`A sub-conta "${name}" será excluída do catálogo. Se algum condomínio a usa, o sistema recusa: desative-a.`}
      onConfirm={handleDelete}
      appearance="solid"
    />
  );
}
