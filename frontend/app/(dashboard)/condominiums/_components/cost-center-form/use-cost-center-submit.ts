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
import { applyServerErrors } from "@/lib/form-errors";
import {
  costCenterToPayload,
  type CostCenterFormInput,
  type CostCenterFormOutput,
} from "@/lib/schemas/cost-center";

export const COST_CENTERS_URL = "/condominiums/cost-centers";

export function useCostCenterSubmit(
  costCenterId: string | undefined,
  setError: UseFormSetError<CostCenterFormInput>
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCostCentersCreate();
  const updateMutation = useCostCentersPartialUpdate();
  const isEdit = costCenterId !== undefined;

  const done = (message: string, id: string) => {
    queryClient.invalidateQueries({ queryKey: getCostCentersListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getCostCentersRetrieveQueryKey(id) });
    toast.success(message);
    router.push(COST_CENTERS_URL);
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: CostCenterFormOutput) => {
    const payload = costCenterToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: costCenterId, data: payload as Partial<CostCenter> },
        { onSuccess: () => done("Sub-conta salva.", costCenterId), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as CostCenter },
        { onSuccess: (created) => done("Sub-conta cadastrada.", created.id), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
