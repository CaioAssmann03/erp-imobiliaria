"use client";

import { CheckboxField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskMonthYear } from "@/lib/billing-plan-payload";

/** Situação e vigência: sem meses, o plano vale sempre que estiver ativo. */
export function ValiditySection() {
  return (
    <FormSection title="Vigência" description="A emissão de um mês usa os planos ativos cuja vigência inclui o mês.">
      <FieldRow columns={3}>
        <TextField
          name="start_month"
          label="Mês inicial"
          inputMode="numeric"
          placeholder="03/2026"
          mask={maskMonthYear}
          hint="Mês/ano em que o plano começa a valer. Em branco: desde sempre."
        />
        <TextField
          name="end_month"
          label="Mês final"
          inputMode="numeric"
          placeholder="12/2026"
          mask={maskMonthYear}
          hint="Último mês em que vale. Em branco: sem data para acabar."
        />
        <CheckboxField name="active" label="Plano ativo" />
      </FieldRow>
    </FormSection>
  );
}
