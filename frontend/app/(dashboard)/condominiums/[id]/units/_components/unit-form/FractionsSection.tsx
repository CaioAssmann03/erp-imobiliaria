"use client";

import { TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskDecimal } from "@/lib/masks";
import { UNIT_FRACTIONS } from "@/lib/schemas/unit";

const fractionMask = (value: string) => maskDecimal(value, 8, 1);

/** As seis frações ideais da unidade: cada uma reparte as despesas de um jeito (a 1ª é a principal). */
export function FractionsSection() {
  return (
    <FormSection
      title="Frações ideais"
      description="Parte da unidade no rateio, de 0 a 1. A 1ª é a principal e as outras são opcionais. Cada fração em uso precisa somar 1 entre as unidades ativas do condomínio."
    >
      {[UNIT_FRACTIONS.slice(0, 3), UNIT_FRACTIONS.slice(3)].map((row) => (
        <FieldRow key={row[0].name} columns={3}>
          {row.map(({ name, label }) => (
            <TextField
              key={name}
              name={name}
              label={label}
              mask={fractionMask}
              inputMode="decimal"
              placeholder="0,00000000"
            />
          ))}
        </FieldRow>
      ))}
    </FormSection>
  );
}
