"use client";

import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import {
  getCostCenterCatalogListQueryKey,
  getCostCenterCatalogRetrieveQueryKey,
  getCostCentersListQueryKey,
  useCostCenterCatalogCreate,
  useCostCenterCatalogPartialUpdate,
} from "@/lib/api/generated";
import type { CostCenterCatalogItem } from "@/lib/api/generated/models";
import { catalogItemUrl } from "@/lib/finance/cost-center-catalog-workspace";
import {
  costCenterCatalogItemToPayload,
  type CostCenterCatalogItemFormInput,
  type CostCenterCatalogItemFormOutput,
} from "@/lib/schemas/cost-center-catalog-item";

/** Salvar uma edição deixa na página; cadastrar abre a sub-conta nova (a lista ao lado já a mostra). */
export function useCatalogItemSubmit(itemId: string | undefined, setError: UseFormSetError<CostCenterCatalogItemFormInput>) {
  return useRecordSubmit<CostCenterCatalogItemFormInput, CostCenterCatalogItemFormOutput, CostCenterCatalogItem>({
    recordId: itemId,
    setError,
    toPayload: costCenterCatalogItemToPayload,
    create: useCostCenterCatalogCreate(),
    update: useCostCenterCatalogPartialUpdate(),
    // Renaming or renumbering an item reaches the sub-contas of the condominiums.
    invalidate: (id) => [getCostCenterCatalogListQueryKey(), getCostCenterCatalogRetrieveQueryKey(id), getCostCentersListQueryKey()],
    messages: { updated: "Sub-conta salva.", created: "Sub-conta cadastrada." },
    redirect: (item, created) => (created ? catalogItemUrl(item.id) : undefined),
  });
}
