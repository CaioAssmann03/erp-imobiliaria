"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { FormField } from "@/components/form/FormField";
import { PersonPicker } from "@/components/PersonPicker";
import { usePersonsRetrieve } from "@/lib/api/generated";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

/** Assessor: mostra a pessoa escolhida (com "Remover") ou o buscador de pessoas. */
export function AdvisorField() {
  const { control, setValue } = useFormContext<CondominiumFormInput>();
  const advisorId = useWatch({ control, name: "advisor" });
  const { data: advisor } = usePersonsRetrieve(advisorId ?? "", {
    query: { enabled: !!advisorId },
  });

  return (
    <FormField id="advisor" label="Assessor">
      {advisorId ? (
        <div className="flex h-9 items-center justify-between rounded-control bg-surface-muted px-3 text-body">
          <span className="truncate">{advisor?.name ?? "Carregando…"}</span>
          <button
            type="button"
            className="text-caption text-ink-soft hover:text-danger"
            onClick={() => setValue("advisor", null)}
          >
            Remover
          </button>
        </div>
      ) : (
        <PersonPicker onSelect={(person) => setValue("advisor", person.id)} />
      )}
    </FormField>
  );
}
