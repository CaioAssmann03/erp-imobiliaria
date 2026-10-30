"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";

import { FormActions } from "@/components/form/FormActions";
import { Button } from "@/components/ui/button";
import { monthFromApi } from "@/lib/billing/billing-plan-payload";
import { billingEntriesUrl, billingEntryUrl, type BillingEntriesScope } from "@/lib/billing/billing-entry-workspace";
import {
  billingEntryDefaults,
  billingEntrySchema,
  type BillingEntryFormInput,
  type BillingEntryFormOutput,
} from "@/lib/schemas/billing-entry";
import { toast } from "@/lib/errors/toast";

import { EntryAmountSection, EntryIdentitySection, EntryUnitsSection } from "./entry-form/EntryFormFields";
import { EntryPreview } from "./entry-form/EntryPreview";
import { useEntrySubmit } from "./entry-form/use-entry-submit";
import { useEntriesScope } from "./use-entries-scope";

function Form({ scope }: { scope: BillingEntriesScope }) {
  const router = useRouter();
  const methods = useForm<BillingEntryFormInput, unknown, BillingEntryFormOutput>({
    resolver: zodResolver(billingEntrySchema),
    defaultValues: billingEntryDefaults(scope.condominium, monthFromApi(scope.month)),
    mode: "onTouched",
  });
  const { handleSubmit, setError } = methods;
  // O lançamento criado abre ao lado da lista, no mês em que ele começa (que pode não ser o da lista).
  const { submit, isSubmitting } = useEntrySubmit(
    (entry) => router.push(billingEntryUrl(entry.id, { condominium: entry.condominium, month: entry.start_month })),
    setError
  );

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        <div id="lancamento" className="scroll-mt-20">
          <EntryIdentitySection />
        </div>
        <div id="rateio" className="scroll-mt-20">
          <EntryAmountSection />
        </div>
        <div id="unidades" className="scroll-mt-20">
          <EntryUnitsSection />
        </div>
        <div id="valores" className="scroll-mt-20">
          <EntryPreview />
        </div>
        <FormActions isSubmitting={isSubmitting} submitLabel="Incluir lançamento">
          <Button type="button" variant="secondary" onClick={() => router.push(billingEntriesUrl(scope))}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}

/** Client Component: o lançamento novo, no condomínio e no mês da lista. Sem condomínio escolhido não há o que preencher. */
export function NewBillingEntryForm() {
  const scope = useEntriesScope();

  if (scope.condominium === "")
    return (
      <div className="rounded-card bg-surface p-8 text-center">
        <p className="text-body text-ink-soft">Escolha o condomínio na lista para incluir um valor nos boletos dele.</p>
      </div>
    );

  return <Form scope={scope} />;
}
