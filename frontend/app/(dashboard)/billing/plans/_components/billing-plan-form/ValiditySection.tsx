"use client";

import { CheckboxField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";

/** Situação e vigência: sem meses, o plano vale sempre que estiver ativo. */
export function ValiditySection() {
  return (
    <FormSection title="Vigência" description="A emissão de um mês usa os planos ativos cuja vigência inclui o mês.">
      <FieldRow columns={3}>
        <TextField name="start_month" label="Mês inicial" type="month" hint="Opcional." />
        <TextField name="end_month" label="Mês final" type="month" hint="Opcional." />
        <CheckboxField name="active" label="Plano ativo" />
      </FieldRow>
    </FormSection>
  );
}
