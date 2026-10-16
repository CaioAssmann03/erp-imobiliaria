"use client";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { useBlocksList } from "@/lib/api/generated";
import { maskInteger } from "@/lib/masks";
import { UNIT_TYPES } from "@/lib/schemas/unit";

export function IdentificationSection({ condominiumId }: { condominiumId: string }) {
  const { data: blocks } = useBlocksList({ condominium: condominiumId, limit: 100 });

  return (
    <FormSection title="Identificação">
      <FieldRow columns={3}>
        <TextField
          name="name"
          label="Unidade"
          required
          maxLength={30}
          placeholder="Ex.: 101"
          autoComplete="off"
        />
        <SelectField
          name="block"
          label="Bloco"
          placeholder="Sem bloco"
          options={(blocks?.results ?? []).map((block) => ({ value: block.id, label: block.name }))}
        />
        <SelectField name="type" label="Tipo" options={UNIT_TYPES} />
      </FieldRow>
      <FieldRow>
        <TextField name="registration_number" label="Matrícula do imóvel" maxLength={60} />
        <TextField
          name="resident_count"
          label="Nº de moradores"
          mask={(value) => maskInteger(value, 3)}
          inputMode="numeric"
        />
      </FieldRow>
      <FieldRow>
        <CheckboxField name="is_manager_unit" label="Unidade do síndico" />
        <CheckboxField name="is_billing_blocked" label="Bloquear lançamentos" />
      </FieldRow>
      <FieldRow>
        <CheckboxField name="active" label="Cadastro ativo" />
      </FieldRow>
    </FormSection>
  );
}
