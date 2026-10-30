"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { DateField, TextField } from "@/components/form/fields";
import { FormField } from "@/components/form/FormField";
import { FieldRow } from "@/components/form/FormSection";
import { NewPersonDialog } from "@/components/persons/NewPersonDialog";
import { PersonSearchSelect } from "@/components/persons/PersonSearchSelect";
import { Button } from "@/components/ui/button";
import { useUnitPeopleCreate } from "@/lib/api/generated";
import type { Person, UnitPerson } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { maskDecimal } from "@/lib/format/masks";
import {
  UNIT_PERSON_DEFAULTS,
  unitPersonSchema,
  type UnitPersonFormInput,
  type UnitPersonFormOutput,
} from "@/lib/schemas/unit";
import { toast } from "@/lib/errors/toast";

import { newPendingKey, type PendingLink } from "./pending-link";

interface UnitPersonFormProps {
  /** Sem unidade (cadastro novo) o vínculo não é gravado: vai para `onAdd` e é salvo junto com a unidade. */
  unitId?: string;
  /** O papel da seção onde o formulário está (Proprietário ou Inquilino): não se escolhe. */
  role: "owner" | "tenant";
  onCreated?: () => void;
  onAdd?: (link: PendingLink) => void;
}

export function UnitPersonForm({ unitId, role: fixedRole, onCreated, onAdd }: UnitPersonFormProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [personError, setPersonError] = useState<string>();
  const createMutation = useUnitPeopleCreate();

  const methods = useForm<UnitPersonFormInput, unknown, UnitPersonFormOutput>({
    resolver: zodResolver(unitPersonSchema),
    defaultValues: { ...UNIT_PERSON_DEFAULTS, role: fixedRole },
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
    if (onAdd || !unitId) {
      onAdd?.({
        key: newPendingKey(),
        person,
        role: values.role as PendingLink["role"],
        ownership_percentage: values.role === "owner" ? (values.ownership_percentage ?? null) : null,
        start_date: values.start_date!,
        end_date: values.end_date ?? null,
      });
      setPerson(null);
      reset({ ...UNIT_PERSON_DEFAULTS, role: fixedRole });
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
          ownership_percentage:
            values.role === "owner" ? values.ownership_percentage : null,
        } as UnitPerson,
      },
      {
        onSuccess: () => {
          setPerson(null);
          reset({ ...UNIT_PERSON_DEFAULTS, role: fixedRole });
          toast.success("Vínculo adicionado.");
          onCreated?.();
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      },
    );
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-3 rounded-panel border border-border p-4">
        <p className="mb-2 text-body font-medium">Adicionar vínculo</p>

        <div className="flex items-end gap-2">
          <FormField id="link-person" label="Pessoa" required error={personError} className="min-w-0 flex-1">
            <PersonSearchSelect
              id="link-person"
              label="Pessoa"
              value={person?.id ?? ""}
              invalid={Boolean(personError)}
              describedBy={personError ? "link-person-message" : undefined}
              onChange={(_id, selected) => {
                setPerson(selected);
                setPersonError(undefined);
              }}
            />
          </FormField>
          <NewPersonDialog
            onCreated={(created) => {
              setPerson(created);
              setPersonError(undefined);
            }}
          />
        </div>

        <FieldRow
          template={role === "owner" ? "1fr 1fr 1fr" : "1fr 1fr"}
        >
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
          <DateField name="start_date" label="Início" required />
          <DateField
            name="end_date"
            label="Fim"
            hint="Vazio: vínculo ativo"
          />
        </FieldRow>

        <div className="flex justify-end pt-3">
          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {createMutation.isPending ? "Adicionando…" : "Adicionar vínculo"}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
