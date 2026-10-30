"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/format";
import {
  EMPTY_ENTRY_LINE,
  entriesBatchDefaults,
  entriesBatchSchema,
  type EntriesBatchFormInput,
  type EntriesBatchFormOutput,
} from "@/lib/schemas/entry-batch";

import { entriesUrl } from "@/lib/entry-batch-workspace";

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
  const router = useRouter();
  const methods = useForm<EntriesBatchFormInput, unknown, EntriesBatchFormOutput>({
    resolver: zodResolver(entriesBatchSchema),
    defaultValues: entriesBatchDefaults(todayIso()),
    mode: "onTouched",
  });
  const { handleSubmit, setError } = methods;
  const { submit, isSubmitting } = useEntriesBatchSubmit(setError);

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <div id="lote" className="scroll-mt-20">
          <BatchSection />
        </div>
        <div id="lancamentos" className="scroll-mt-20">
          <Lines />
        </div>
        <FormActions isSubmitting={isSubmitting} submitLabel="Registrar lançamentos">
          <Button type="button" variant="secondary" onClick={() => router.push(entriesUrl())}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
