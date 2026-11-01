"use client";

import { RecordDeleteButton } from "@/components/RecordDeleteButton";
import { getDashboardRetrieveQueryKey, getPersonsListQueryKey, usePersonsDestroy } from "@/lib/api/generated";
import { personsUrl } from "@/lib/persons/person-workspace";

/** Client Component: exclui a pessoa aberta (confirmação) e volta à tela de pessoas, sem ninguém aberta. */
export function PersonDeleteButton({ personId, name }: { personId: string; name: string }) {
  const destroyMutation = usePersonsDestroy();

  return (
    <RecordDeleteButton
      title="Excluir pessoa?"
      description={`"${name}" será excluída. Esta ação não pode ser desfeita.`}
      destroy={(options) => destroyMutation.mutate({ id: personId }, options)}
      invalidate={[getPersonsListQueryKey(), getDashboardRetrieveQueryKey()]}
      success="Pessoa excluída."
      failure="Não foi possível excluir a pessoa."
      redirectTo={personsUrl()}
    />
  );
}
