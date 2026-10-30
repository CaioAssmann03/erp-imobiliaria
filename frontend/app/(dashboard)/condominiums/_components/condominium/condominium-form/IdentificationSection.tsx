"use client";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskCnpj } from "@/lib/format/masks";

import { AdvisorField } from "./AdvisorField";

// A empresa administradora é a do usuário logado: o backend define e o formulário não envia.
export function IdentificationSection() {
  return (
    <FormSection title="Identificação">
      <FieldRow>
        <TextField name="name" label="Nome do condomínio" required autoComplete="off" />
      </FieldRow>
      <FieldRow columns={3}>
        <TextField
          name="cnpj"
          label="CNPJ"
          required
          mask={maskCnpj}
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
        />
        <TextField name="municipal_registration" label="Inscrição municipal" maxLength={30} />
        <SelectField
          name="type"
          label="Tipo"
          options={[
            { value: "residential", label: "Residencial" },
            { value: "commercial", label: "Comercial" },
          ]}
        />
      </FieldRow>
      <FieldRow>
        <CheckboxField name="active" label="Cadastro ativo" />
        <AdvisorField />
      </FieldRow>
    </FormSection>
  );
}
