"use client";

import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import {
  getCostCentersListQueryKey,
  getCostCentersRetrieveQueryKey,
  useCostCentersCreate,
  useCostCentersPartialUpdate,
} from "@/lib/api/generated";
import type { CostCenter } from "@/lib/api/generated/models";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";
import { costCenterToPayload, type CostCenterFormInput, type CostCenterFormOutput } from "@/lib/schemas/cost-center";

export function useCostCenterSubmit(
  costCenterId: string | undefined,
  setError: UseFormSetError<CostCenterFormInput>,
  /** Sem ele, volta à lista de sub-contas do condomínio da sub-conta salva. */
  returnUrl?: string
) {
  return useRecordSubmit<CostCenterFormInput, CostCenterFormOutput, CostCenter>({
    recordId: costCenterId,
    setError,
    toPayload: costCenterToPayload,
    create: useCostCentersCreate(),
    update: useCostCentersPartialUpdate(),
    invalidate: (id) => [getCostCentersListQueryKey(), getCostCentersRetrieveQueryKey(id)],
    messages: { updated: "Sub-conta salva.", created: "Sub-conta cadastrada." },
    redirect: (costCenter) => returnUrl ?? condominiumPageUrl(costCenter.condominium, "cost-centers"),
  });
}
