"use client";

import { CheckboxField, MonthField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";

/** Situação e vigência: sem meses, o plano vale sempre que estiver ativo. */
export function ValiditySection() {
  return (
    <FormSection title="Vigência" description="A emissão de um mês usa os planos ativos cuja vigência inclui o mês.">
      <FieldRow columns={3}>
        <MonthField
          name="start_month"
          label="Mês inicial"
          hint="Mês/ano em que o plano começa a valer. Em branco: desde sempre."
        />
        <MonthField
          name="end_month"
          label="Mês final"
          hint="Último mês em que vale. Em branco: sem data para acabar."
        />
        <CheckboxField name="active" label="Plano ativo" />
      </FieldRow>
    </FormSection>
  );
}
