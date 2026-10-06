"use client";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskDecimal, maskInteger, maskMoney } from "@/lib/masks";

const money = (value: string) => maskMoney(value, 10);
const percent = (value: string) => maskDecimal(value, 2, 3);

export function BillingSection() {
  return (
    <FormSection title="Cobrança">
      <FieldRow>
        <TextField
          name="due_day"
          label="Dia de vencimento"
          mask={(value) => maskInteger(value, 2)}
          inputMode="numeric"
          hint="De 1 a 28."
        />
        <SelectField
          name="calculation_period"
          label="Competência de cálculo"
          options={[
            { value: "reference", label: "Referência do cálculo" },
            { value: "following", label: "Posterior à referência" },
          ]}
        />
      </FieldRow>
      <CheckboxField name="due_on_business_day" label="Vencimento por dia útil" />
      <FieldRow columns={3}>
        <TextField
          name="credit_limit"
          label="Limite de crédito (R$)"
          mask={money}
          inputMode="numeric"
          placeholder="0,00"
        />
        <TextField
          name="early_payment_discount_percentage"
          label="Desconto em dia (%)"
          mask={percent}
          inputMode="decimal"
          placeholder="0,00"
        />
        <TextField
          name="early_payment_discount_days"
          label="Dias antes do venc."
          mask={(value) => maskInteger(value, 2)}
          inputMode="numeric"
          hint="Prazo do desconto."
        />
      </FieldRow>
    </FormSection>
  );
}
