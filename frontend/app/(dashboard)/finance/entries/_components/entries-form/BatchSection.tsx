"use client";

import { useWatch } from "react-hook-form";

import { DateField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { BATCH_ORIGINS } from "@/lib/schemas/entry-batch";

/** O lote: data e origem (banco, caixa ou caixa extra); os caixas levam o número. */
export function BatchSection() {
  const origin = useWatch({ name: "origin" }) as string;

  return (
    <FormSection title="Lote" description="Um lote pode reunir lançamentos de vários condomínios.">
      <FieldRow columns={3}>
        <DateField name="batch_date" label="Data do lote" required />
        <SelectField name="origin" label="Origem" required options={BATCH_ORIGINS} />
        {origin !== "bank" && (
          <TextField
            name="cash_number"
            label="Número do caixa"
            required
            inputMode="numeric"
            mask={(value) => value.replace(/\D/g, "").slice(0, 9)}
          />
        )}
      </FieldRow>
    </FormSection>
  );
}
