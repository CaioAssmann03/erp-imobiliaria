"use client";

import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import {
  getDashboardRetrieveQueryKey,
  getPersonsListQueryKey,
  getPersonsRetrieveQueryKey,
  usePersonsCreate,
  usePersonsPartialUpdate,
} from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { CONDOMINIUMS_MODULE } from "@/lib/persons/person-module";
import { personUrl } from "@/lib/persons/person-workspace";
import { personToPayload, type PersonFormInput, type PersonFormOutput } from "@/lib/schemas/person";

export function usePersonSubmit(personId: string | undefined, setError: UseFormSetError<PersonFormInput>) {
  const createMutation = usePersonsCreate();

  return useRecordSubmit<PersonFormInput, PersonFormOutput, Person>({
    recordId: personId,
    setError,
    toPayload: personToPayload,
    // O cadastro diz de que módulo a pessoa é (Condomínios).
    create: {
      mutate: (variables, options) => createMutation.mutate({ ...variables, params: { person_module: CONDOMINIUMS_MODULE } }, options),
      isPending: createMutation.isPending,
    },
    update: usePersonsPartialUpdate(),
    invalidate: (id) => [getPersonsListQueryKey(), getDashboardRetrieveQueryKey(), getPersonsRetrieveQueryKey(id)],
    messages: { updated: "Pessoa salva.", created: "Pessoa cadastrada." },
    redirect: (person, created) => (created ? personUrl(person.id) : undefined),
  });
}
