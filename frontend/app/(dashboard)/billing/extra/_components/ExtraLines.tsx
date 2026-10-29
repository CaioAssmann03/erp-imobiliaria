"use client";

import { Plus } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { useBillingEntriesList, useBillingEventsList } from "@/lib/api/generated";
import { feeLine, newLine } from "@/lib/extra-billing-payload";
import { maskMoney } from "@/lib/masks";
import type { ExtraBillingFormInput } from "@/lib/schemas/extra-billing";

import { ExtraLineFields } from "./ExtraLineFields";

/** Os valores do boleto: cada linha é escrita como um lançamento da Inclusão de valores; a tarifa de registro é uma delas. */
export function ExtraLines() {
  const { control, formState } = useFormContext<ExtraBillingFormInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const condominium = useWatch({ control, name: "condominium" });
  const { data: events } = useBillingEventsList({ active: true, limit: 100 });
  const feeEvent = events?.results.find((item) => item.credits_company);
  // O valor da tarifa não é fixo: a sugestão é o do último lançamento dela neste condomínio (a pessoa pode mudar).
  const { data: feeEntries } = useBillingEntriesList(
    { condominium, event: feeEvent?.id, limit: 1 },
    { query: { enabled: condominium !== "" && feeEvent !== undefined } }
  );
  const suggestedFee = feeEntries?.results[0]?.amount;
  const listError = formState.errors.lines?.root?.message ?? (formState.errors.lines as { message?: string } | undefined)?.message;

  return (
    <FormSection title="Valores" description="O que o boleto cobra. Individual: o mesmo valor em cada unidade. Coletivo e fração: um total dividido entre elas.">
      <ul className="space-y-3">
        {fields.map((field, index) => (
          <ExtraLineFields key={field.id} index={index} condominium={condominium} onRemove={fields.length > 1 ? () => remove(index) : undefined} />
        ))}
      </ul>
      {listError && (
        <p role="alert" className="text-caption text-danger">
          {listError}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => append(newLine())}>
          <Plus className="size-4" />
          Adicionar valor
        </Button>
        {feeEvent && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append(feeLine(feeEvent.id, suggestedFee ? maskMoney(Number(suggestedFee).toFixed(2).replace(".", ",")) : ""))}
          >
            <Plus className="size-4" />
            Tarifa de registro
          </Button>
        )}
      </div>
    </FormSection>
  );
}
