"use client";

import { DateField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskInteger } from "@/lib/masks";

export function AdjustmentSection() {
  return (
    <FormSection title="Reajuste">
      <FieldRow>
        <DateField name="start_date" label="Início da administração" />
        <DateField name="adjustment_base_date" label="Base do reajuste" />
      </FieldRow>
      <FieldRow>
        <TextField
          name="adjustment_period_months"
          label="Periodicidade (meses)"
          mask={(value) => maskInteger(value, 3)}
          inputMode="numeric"
        />
        <TextField
          name="adjustment_index"
          label="Índice de reajuste"
          maxLength={30}
          placeholder="IGPM, INCC…"
        />
      </FieldRow>
    </FormSection>
  );
}
