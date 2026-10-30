"use client";

import { CheckboxField, SelectField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { BILLING_RECIPIENTS } from "@/lib/schemas/unit";

/** Cobrança da unidade: quem recebe o boleto e se os lançamentos estão bloqueados. */
export function BillingSection() {
  return (
    <FormSection title="Boleto">
      <FieldRow>
        <SelectField
          name="billing_recipient"
          label="Quem recebe o boleto"
          options={BILLING_RECIPIENTS}
          hint="Sem inquilino atual, o boleto vai para o proprietário."
        />
        <CheckboxField name="is_billing_blocked" label="Bloquear lançamentos" />
      </FieldRow>
    </FormSection>
  );
}
