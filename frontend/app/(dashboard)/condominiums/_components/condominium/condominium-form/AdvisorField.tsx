"use client";

import { useFormContext } from "react-hook-form";

import { PersonSelectField } from "@/components/form/fields";
import { NewPersonDialog } from "@/components/persons/NewPersonDialog";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

/** Assessor: a pessoa escolhida no campo com busca (opcional: o "x" a remove) e o + que cadastra uma pessoa nova ali mesmo. */
export function AdvisorField() {
  const { setValue } = useFormContext<CondominiumFormInput>();

  return (
    <div className="flex items-end gap-2">
      <PersonSelectField name="advisor" label="Assessor" emptyValue={null} className="min-w-0 flex-1" />
      <NewPersonDialog onCreated={(person) => setValue("advisor", person.id, { shouldDirty: true, shouldValidate: true })} />
    </div>
  );
}
