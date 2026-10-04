"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getCondominiumsListQueryKey,
  getCondominiumsRetrieveQueryKey,
  getDashboardRetrieveQueryKey,
  useCondominiumsCreate,
  useCondominiumsPartialUpdate,
} from "@/lib/api/generated";
import type { Condominium } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import {
  condominiumToPayload,
  type CondominiumFormInput,
  type CondominiumFormOutput,
} from "@/lib/schemas/condominium";

/** Grava o condomínio (criação ou edição), atualiza os caches e navega para o próximo passo. */
export function useCondominiumSubmit(
  condominiumId: string | undefined,
  setError: UseFormSetError<CondominiumFormInput>
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCondominiumsCreate();
  const updateMutation = useCondominiumsPartialUpdate();
  const isEdit = condominiumId !== undefined;

  const invalidate = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getCondominiumsListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getCondominiumsRetrieveQueryKey(id) }),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: CondominiumFormOutput) => {
    const payload = condominiumToPayload(values, isEdit);

    if (isEdit) {
      updateMutation.mutate(
        { id: condominiumId, data: payload as Partial<Condominium> },
        {
          onSuccess: () => {
            invalidate(condominiumId);
            toast.success("Condomínio salvo.");
            router.push("/condominiums");
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Condominium },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Condomínio cadastrado.");
            router.push(`/condominiums/${created.id}/units`);
          },
          onError,
        }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
