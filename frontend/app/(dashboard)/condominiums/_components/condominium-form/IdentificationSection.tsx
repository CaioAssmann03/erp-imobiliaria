"use client";

import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { useCompaniesList } from "@/lib/api/generated";
import { maskCnpj } from "@/lib/masks";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

import { AdvisorField } from "./AdvisorField";

export function IdentificationSection({ isEdit }: { isEdit: boolean }) {
  const { getValues, setValue } = useFormContext<CondominiumFormInput>();
  const { data } = useCompaniesList({ limit: 100 });
  const companies = useMemo(() => data?.results ?? [], [data]);

  // Cadastro novo com uma única empresa: já seleciona.
  useEffect(() => {
    if (!isEdit && companies.length === 1 && !getValues("company")) {
      setValue("company", companies[0].id);
    }
  }, [isEdit, companies, getValues, setValue]);

  return (
    <FormSection title="Identificação">
      <FieldRow template="3fr 2fr">
        <TextField name="name" label="Nome do condomínio" required autoComplete="off" />
        <SelectField
          name="company"
          label="Empresa administradora"
          required
          placeholder="Selecione…"
          options={companies.map((company) => ({
            value: company.id,
            label: company.trade_name || company.legal_name,
          }))}
        />
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
        <AdvisorField />
        <CheckboxField name="active" label="Cadastro ativo" />
      </FieldRow>
    </FormSection>
  );
}
