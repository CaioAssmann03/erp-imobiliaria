"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

import {
  getDashboardRetrieveQueryKey,
  getPersonsListQueryKey,
  getPersonsRetrieveQueryKey,
  usePersonsCreate,
  usePersonsPartialUpdate,
} from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { personUrl } from "@/lib/person-workspace";
import { personToPayload, type PersonFormInput, type PersonFormOutput } from "@/lib/schemas/person";
import { toast } from "@/lib/toast";

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
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Person, params: { person_module: CONDOMINIUMS_MODULE } },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Pessoa cadastrada.");
            router.push(personUrl(created.id));
          },
          onError,
        }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
