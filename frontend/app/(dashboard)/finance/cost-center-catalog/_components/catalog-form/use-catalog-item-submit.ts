"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

import {
  getCostCenterCatalogListQueryKey,
  getCostCenterCatalogRetrieveQueryKey,
  getCostCentersListQueryKey,
  useCostCenterCatalogCreate,
  useCostCenterCatalogPartialUpdate,
} from "@/lib/api/generated";
import type { CostCenterCatalogItem } from "@/lib/api/generated/models";
import { catalogItemUrl } from "@/lib/cost-center-catalog-workspace";
import { applyServerErrors } from "@/lib/form-errors";
import {
  costCenterCatalogItemToPayload,
  type CostCenterCatalogItemFormInput,
  type CostCenterCatalogItemFormOutput,
} from "@/lib/schemas/cost-center-catalog-item";
import { toast } from "@/lib/toast";

export function useCatalogItemSubmit(itemId: string | undefined, setError: UseFormSetError<CostCenterCatalogItemFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCostCenterCatalogCreate();
  const updateMutation = useCostCenterCatalogPartialUpdate();

  // Salvar uma edição deixa na página; cadastrar abre a sub-conta nova (a lista ao lado já a mostra).
  const done = (message: string, id: string, opensItem: boolean) => {
    queryClient.invalidateQueries({ queryKey: getCostCenterCatalogListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getCostCenterCatalogRetrieveQueryKey(id) });
    // Renaming or renumbering an item reaches the sub-contas of the condominiums.
    queryClient.invalidateQueries({ queryKey: getCostCentersListQueryKey() });
    toast.success(message);
    if (opensItem) router.push(catalogItemUrl(id));
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: CostCenterCatalogItemFormOutput) => {
    const payload = costCenterCatalogItemToPayload(values);
    if (itemId !== undefined) {
      updateMutation.mutate(
        { id: itemId, data: payload as Partial<CostCenterCatalogItem> },
        { onSuccess: () => done("Sub-conta salva.", itemId, false), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as CostCenterCatalogItem },
        { onSuccess: (created) => done("Sub-conta cadastrada.", created.id, true), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
