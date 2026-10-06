"use client";

import { TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskMoney } from "@/lib/masks";

const money = (value: string) => maskMoney(value, 8);

export function MetersSection() {
  return (
    <FormSection title="Medidores individuais" description="Valores fixos cobrados da unidade.">
      <FieldRow columns={3}>
        <TextField name="gas_value" label="Gás (R$)" mask={money} inputMode="numeric" placeholder="0,00" />
        <TextField name="water_value" label="Água (R$)" mask={money} inputMode="numeric" placeholder="0,00" />
        <TextField
          name="electricity_value"
          label="Energia (R$)"
          mask={money}
          inputMode="numeric"
          placeholder="0,00"
        />
      </FieldRow>
    </FormSection>
  );
}
