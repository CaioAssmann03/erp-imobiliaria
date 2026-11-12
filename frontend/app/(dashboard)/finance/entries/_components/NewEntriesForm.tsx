"use client";

import { useFieldArray, useWatch } from "react-hook-form";

import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { useRecordForm } from "@/hooks/use-record-form";
import { todayIso } from "@/lib/format/format";
import { EMPTY_ENTRY_LINE, entriesBatchDefaults, entriesBatchSchema, type EntriesBatchFormInput } from "@/lib/schemas/entry-batch";

import { entriesUrl } from "@/lib/finance/entry-batch-workspace";

import { BatchSection } from "./entries-form/BatchSection";
import { EntryLineFields } from "./entries-form/EntryLineFields";
import { useEntriesBatchSubmit } from "./entries-form/use-entries-batch-submit";

function Lines() {
  const { fields, append, remove } = useFieldArray<EntriesBatchFormInput, "lines">({ name: "lines" });
  const batchDate = useWatch({ name: "batch_date" }) as string;

  return (
    <FormSection title="Lançamentos" description="Cada lançamento pode ser de um condomínio diferente.">
      {fields.map((field, index) => (
        <EntryLineFields key={field.id} index={index} canRemove={fields.length > 1} onRemove={() => remove(index)} />
      ))}
      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              ...EMPTY_ENTRY_LINE,
              entry_date: batchDate || todayIso(),
              competence_month: (batchDate || todayIso()).slice(0, 7),
            })
          }
        >
          Adicionar lançamento
        </Button>
      </div>
    </FormSection>
  );
}

/** Lançamento manual em lote (pode cobrir vários condomínios de uma vez). */
export function NewEntriesForm() {
  const methods = useRecordForm({ schema: entriesBatchSchema, defaults: entriesBatchDefaults(todayIso()) });
  const { submit, isSubmitting } = useEntriesBatchSubmit(methods.setError);

  return (
    <RecordForm methods={methods} onSubmit={submit} isSubmitting={isSubmitting} cancelHref={entriesUrl()} submitLabel="Registrar lançamentos">
      <SectionAnchor id="lote">
        <BatchSection />
      </SectionAnchor>
      <SectionAnchor id="lancamentos">
        <Lines />
      </SectionAnchor>
    </RecordForm>
  );
}
