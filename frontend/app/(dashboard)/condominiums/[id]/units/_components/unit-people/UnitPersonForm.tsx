"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextField } from "@/components/form/fields";
import { FormField } from "@/components/form/FormField";
import { FieldRow } from "@/components/form/FormSection";
import { PersonPicker } from "@/components/PersonPicker";
import { Button } from "@/components/ui/button";
import { useUnitPeopleCreate } from "@/lib/api/generated";
import type { Person, UnitPerson } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { maskDecimal } from "@/lib/masks";
import { formattedPersonDocument } from "@/lib/person-document";
import {
  UNIT_PERSON_DEFAULTS,
  unitPersonSchema,
  type UnitPersonFormInput,
  type UnitPersonFormOutput,
} from "@/lib/schemas/unit";

interface UnitPersonFormProps {
  unitId: string;
  onCreated: () => void;
}

/** Vincula uma pessoa à unidade como proprietário ou locatário. */
export function UnitPersonForm({ unitId, onCreated }: UnitPersonFormProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [personError, setPersonError] = useState<string>();
  const createMutation = useUnitPeopleCreate();

  const methods = useForm<UnitPersonFormInput, unknown, UnitPersonFormOutput>({
    resolver: zodResolver(unitPersonSchema),
    defaultValues: UNIT_PERSON_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError, setValue, control } = methods;
  const role = useWatch({ control, name: "role" });

  // Só proprietário tem participação; para locatário o campo some e o valor é descartado.
  useEffect(() => {
    setValue("ownership_percentage", role === "owner" ? "100,00" : "");
  }, [role, setValue]);

  const onSubmit = (values: UnitPersonFormOutput) => {
    if (!person) {
      setPersonError("Selecione uma pessoa");
      return;
    }
    createMutation.mutate(
      {
        data: {
          unit: unitId,
          person: person.id,
          role: values.role,
          start_date: values.start_date!,
          end_date: values.end_date ?? null,
          ownership_percentage: values.role === "owner" ? values.ownership_percentage : null,
        } as UnitPerson,
      },
      {
        onSuccess: () => {
          setPerson(null);
          reset();
          toast.success("Vínculo adicionado.");
          onCreated();
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-1 rounded-panel bg-surface-muted p-4">
        <p className="mb-2 text-body font-medium">Adicionar vínculo</p>

        <FormField id="link-person" label="Pessoa" required error={personError}>
          {person ? (
            <div className="flex h-9 items-center justify-between rounded-control bg-surface px-3 text-body">
              <span className="truncate">
                {person.name} · {formattedPersonDocument(person)}
              </span>
              <button
                type="button"
                className="text-caption text-ink-soft hover:text-danger"
                onClick={() => setPerson(null)}
              >
                Trocar
              </button>
            </div>
          ) : (
            <PersonPicker
              onSelect={(selected) => {
                setPerson(selected);
                setPersonError(undefined);
              }}
            />
          )}
        </FormField>

        <FieldRow columns={role === "owner" ? 3 : 2}>
          <SelectField
            name="role"
            label="Papel"
            options={[
              { value: "owner", label: "Proprietário" },
              { value: "tenant", label: "Locatário" },
            ]}
          />
          {role === "owner" && (
            <TextField
              name="ownership_percentage"
              label="Participação (%)"
              required
              mask={(value) => maskDecimal(value, 2, 3)}
              inputMode="decimal"
              placeholder="100,00"
            />
          )}
          <TextField name="start_date" label="Início da vigência" type="date" required />
        </FieldRow>
        <FieldRow>
          <TextField
            name="end_date"
            label="Fim da vigência"
            type="date"
            hint="Deixe em branco enquanto o vínculo estiver ativo."
          />
        </FieldRow>

        <Button type="button" disabled={createMutation.isPending} onClick={handleSubmit(onSubmit)}>
          {createMutation.isPending ? "Adicionando…" : "Adicionar vínculo"}
        </Button>
      </div>
    </FormProvider>
  );
}
