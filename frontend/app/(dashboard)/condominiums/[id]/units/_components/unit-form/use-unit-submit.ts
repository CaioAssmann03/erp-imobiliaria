"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getDashboardRetrieveQueryKey,
  getUnitsListQueryKey,
  getUnitsRetrieveQueryKey,
  useUnitsCreate,
  useUnitsPartialUpdate,
} from "@/lib/api/generated";
import type { Unit } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { unitToPayload, type UnitFormInput, type UnitFormOutput } from "@/lib/schemas/unit";

export function useUnitSubmit(
  condominiumId: string,
  unitId: string | undefined,
  setError: UseFormSetError<UnitFormInput>,
  returnUrl?: string
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useUnitsCreate();
  const updateMutation = useUnitsPartialUpdate();
  const isEdit = unitId !== undefined;
  const unitsUrl = `/condominiums/${condominiumId}/units`;

  const invalidate = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getUnitsRetrieveQueryKey(id) }),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: UnitFormOutput) => {
    const payload = unitToPayload(values, condominiumId, isEdit);

    if (isEdit) {
      updateMutation.mutate(
        { id: unitId, data: payload as Partial<Unit> },
        {
          onSuccess: () => {
            invalidate(unitId);
            toast.success("Unidade salva.");
            router.push(returnUrl ?? unitsUrl);
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Unit },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Unidade cadastrada. Agora você pode vincular proprietários e locatários.");
            router.push(`${unitsUrl}/${created.id}`);
          },
          onError,
        }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
