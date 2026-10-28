"use client";

import Link from "next/link";

import { TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { useCondominiumApportionmentCriteriaList } from "@/lib/api/generated";
import { maskDecimal } from "@/lib/masks";

const fractionMask = (value: string) => maskDecimal(value, 8, 1);

/**
 * A fração da unidade em cada critério de rateio do condomínio (de 0 a 1). Cada critério em uso
 * precisa somar 1 entre as unidades ativas; os critérios são cadastrados na tela do condomínio.
 */
export function FractionsSection({ condominiumId }: { condominiumId: string }) {
  const { data } = useCondominiumApportionmentCriteriaList({ condominium: condominiumId, limit: 100 });
  const criteria = data?.results ?? [];

  return (
    <FormSection
      title="Frações ideais"
      description="Parte da unidade no rateio de cada critério, de 0 a 1. O principal é obrigatório para ratear; os outros são opcionais. Cada critério em uso precisa somar 1 entre as unidades ativas do condomínio."
    >
      <FieldRow columns={3}>
        {criteria.map((criterion) => (
          <TextField
            key={criterion.id}
            name={`fractions.${criterion.id}`}
            label={criterion.name}
            mask={fractionMask}
            inputMode="decimal"
            placeholder="0,00000000"
          />
        ))}
      </FieldRow>
      <p className="text-caption text-ink-soft">
        Precisa de outro critério de rateio?{" "}
        <Link href={`/condominiums/${condominiumId}`} className="underline">
          Cadastre na tela do condomínio
        </Link>
        .
      </p>
    </FormSection>
  );
}
