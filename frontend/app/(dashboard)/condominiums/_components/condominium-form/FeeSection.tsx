"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskDecimal, maskMoney } from "@/lib/masks";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

const money = (value: string) => maskMoney(value, 10);
const percent = (value: string) => maskDecimal(value, 2, 3);

/** Taxa de administração: fixa (valor) ou variável (percentual sobre receita/despesa). */
export function FeeSection() {
  const { control } = useFormContext<CondominiumFormInput>();
  const feeType = useWatch({ control, name: "fee_type" });

  return (
    <FormSection title="Taxa de administração" description="Fixa em reais ou variável em percentual.">
      <FieldRow>
        <SelectField
          name="fee_type"
          label="Tipo de taxa"
          options={[
            { value: "fixed", label: "Fixa (valor)" },
            { value: "variable", label: "Variável (percentual)" },
          ]}
        />
        {feeType === "fixed" ? (
          <TextField
            name="fee_amount"
            label="Valor da taxa (R$)"
            required
            mask={money}
            inputMode="numeric"
            placeholder="0,00"
          />
        ) : (
          <TextField
            name="fee_percentage"
            label="Percentual da taxa (%)"
            required
            mask={percent}
            inputMode="decimal"
            placeholder="0,00"
          />
        )}
      </FieldRow>
      {feeType === "variable" && (
        <FieldRow>
          <SelectField
            name="fee_basis"
            label="Incide sobre"
            options={[
              { value: "revenue", label: "Receita" },
              { value: "expense", label: "Despesa" },
            ]}
          />
        </FieldRow>
      )}
      <CheckboxField name="charges_iss_on_fee" label="Cobra ISS sobre a taxa" />
    </FormSection>
  );
}
