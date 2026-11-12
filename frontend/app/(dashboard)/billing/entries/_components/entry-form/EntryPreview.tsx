"use client";

import { Calculator } from "lucide-react";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FormSection } from "@/components/form/FormSection";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBillingEntriesPreview } from "@/lib/api/generated";
import type { BillingEntry } from "@/lib/api/generated/models";
import { canPreview, entryToPayload } from "@/lib/billing/billing-entry-payload";
import { brl } from "@/lib/format/format";
import { billingEntryFormToValues, billingEntrySchema, type BillingEntryFormInput } from "@/lib/schemas/billing-entry";

const PREVIEW_DELAY_MS = 400;

/** A seção "Valores": o que cada unidade pagaria, calculado pela API com o que já está preenchido. */
export function EntryPreview() {
  const { control } = useFormContext<BillingEntryFormInput>();
  const typed = useWatch({ control }) as BillingEntryFormInput;
  const debounced = useDebouncedValue(typed, PREVIEW_DELAY_MS);
  const { mutate, data, isPending, isError, reset } = useBillingEntriesPreview();

  useEffect(() => {
    const parsed = billingEntrySchema.safeParse(debounced);
    const values = parsed.success ? billingEntryFormToValues(parsed.data) : undefined;
    if (!values || !canPreview(values)) {
      reset();
      return;
    }
    mutate({ data: entryToPayload(values) as unknown as BillingEntry, params: { reference_month: values.start_month } });
  }, [debounced, mutate, reset]);

  return (
    <FormSection title="Valores" description="O que cada unidade pagaria, calculado com o que já está preenchido.">
      <div aria-live="polite">
        {!data && !isError && (
          <div className="flex items-start gap-2 rounded-control bg-surface-muted p-3 text-body text-ink-soft">
            <Calculator aria-hidden className="mt-0.5 size-4 shrink-0" />
            {isPending ? "Calculando…" : "Termine de preencher os dados para visualizar os valores."}
          </div>
        )}
        {isError && <p className="text-body text-danger">Não foi possível calcular com estes dados. Confira os campos.</p>}
        {data && (
          <>
            <ul className="divide-y divide-line">
              {data.unit_amounts.map((row) => (
                <li key={row.unit} className="flex justify-between py-1.5 text-body">
                  <span>Unidade {row.unit_name}</span>
                  <span className="tabular-nums">{brl(row.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-line pt-3 text-body font-medium">
              <span>Total</span>
              <span className="tabular-nums">{brl(data.total)}</span>
            </p>
          </>
        )}
      </div>
    </FormSection>
  );
}
