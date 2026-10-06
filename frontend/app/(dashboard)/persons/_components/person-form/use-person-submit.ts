"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getDashboardRetrieveQueryKey,
  getPersonsListQueryKey,
  getPersonsRetrieveQueryKey,
  usePersonsCreate,
  usePersonsPartialUpdate,
} from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { personToPayload, type PersonFormInput, type PersonFormOutput } from "@/lib/schemas/person";

export function usePersonSubmit(personId: string | undefined, setError: UseFormSetError<PersonFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = usePersonsCreate();
  const updateMutation = usePersonsPartialUpdate();
  const isEdit = personId !== undefined;

  const invalidate = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getPersonsListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getPersonsRetrieveQueryKey(id) }),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: PersonFormOutput) => {
    const payload = personToPayload(values, isEdit);

    if (isEdit) {
      updateMutation.mutate(
        { id: personId, data: payload as Partial<Person> },
        {
          onSuccess: () => {
            invalidate(personId);
            toast.success("Pessoa salva.");
            router.push("/persons");
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Person },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Pessoa cadastrada.");
            router.push("/persons");
          },
          onError,
        }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
