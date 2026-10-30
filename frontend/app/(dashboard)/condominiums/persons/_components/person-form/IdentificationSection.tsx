"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { CheckboxField, DateField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskCnpj, maskCpf } from "@/lib/masks";
import type { PersonFormInput } from "@/lib/schemas/person";

const MARITAL_STATUSES = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"];

/** Nome, tipo de pessoa, documento e dados pessoais (só para pessoa física). */
export function IdentificationSection({ isEdit }: { isEdit: boolean }) {
  const { control, getValues, setValue } = useFormContext<PersonFormInput>();
  const kind = useWatch({ control, name: "kind" });
  const isIndividual = kind === "individual";

  // Ao trocar entre física/jurídica, reaplica a máscara do documento.
  useEffect(() => {
    const current = getValues("document");
    if (current) setValue("document", isIndividual ? maskCpf(current) : maskCnpj(current));
  }, [isIndividual, getValues, setValue]);

  return (
    <FormSection title="Identificação">
      <FieldRow template="2fr 1fr">
        <TextField
          name="name"
          label={isIndividual ? "Nome completo" : "Razão social"}
          required
          autoComplete="off"
        />
        <SelectField
          name="kind"
          label="Tipo de pessoa"
          disabled={isEdit}
          hint={isEdit ? "Não pode ser alterado depois do cadastro." : undefined}
          options={[
            { value: "individual", label: "Pessoa física" },
            { value: "legal", label: "Pessoa jurídica" },
          ]}
        />
      </FieldRow>
      <FieldRow columns={3}>
        <TextField
          name="document"
          label={isIndividual ? "CPF" : "CNPJ"}
          required
          mask={isIndividual ? maskCpf : maskCnpj}
          inputMode="numeric"
          placeholder={isIndividual ? "000.000.000-00" : "00.000.000/0000-00"}
        />
        {isIndividual ? (
          <TextField name="rg" label="RG" maxLength={10} />
        ) : (
          <TextField name="ie" label="Inscrição estadual" maxLength={20} />
        )}
        <CheckboxField name="active" label="Cadastro ativo" />
      </FieldRow>
      {isIndividual && (
        <FieldRow columns={3}>
          <DateField name="birthday" label="Data de nascimento" />
          <TextField
            name="marital_status"
            label="Estado civil"
            suggestions={MARITAL_STATUSES}
            maxLength={30}
          />
          <TextField name="job" label="Profissão" maxLength={120} />
        </FieldRow>
      )}
    </FormSection>
  );
}
