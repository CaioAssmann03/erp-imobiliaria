"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getCostCentersListQueryKey,
  getCostCentersRetrieveQueryKey,
  useCostCentersCreate,
  useCostCentersPartialUpdate,
} from "@/lib/api/generated";
import type { CostCenter } from "@/lib/api/generated/models";
import { condominiumUrl } from "@/lib/condominium-registry";
import { applyServerErrors } from "@/lib/form-errors";
import {
  costCenterToPayload,
  type CostCenterFormInput,
  type CostCenterFormOutput,
} from "@/lib/schemas/cost-center";

export function useCostCenterSubmit(
  costCenterId: string | undefined,
  setError: UseFormSetError<CostCenterFormInput>,
  /** Sem ele, volta à seção de sub-contas do condomínio da sub-conta salva. */
  returnUrl?: string
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCostCentersCreate();
  const updateMutation = useCostCentersPartialUpdate();
  const isEdit = costCenterId !== undefined;

  const done = (message: string, saved: CostCenter) => {
    const id = saved.id;
    queryClient.invalidateQueries({ queryKey: getCostCentersListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getCostCentersRetrieveQueryKey(id) });
    toast.success(message);
    router.push(returnUrl ?? condominiumUrl(saved.condominium, "sub-contas"));
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: CostCenterFormOutput) => {
    const payload = costCenterToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: costCenterId, data: payload as Partial<CostCenter> },
        { onSuccess: (saved) => done("Sub-conta salva.", saved), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as CostCenter },
        { onSuccess: (created) => done("Sub-conta cadastrada.", created), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
