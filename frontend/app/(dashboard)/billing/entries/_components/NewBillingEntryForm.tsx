"use client";

import { useRouter } from "next/navigation";

import { monthFromApi } from "@/lib/billing/billing-plan-payload";
import { billingEntriesUrl, billingEntryUrl, type BillingEntriesScope } from "@/lib/billing/billing-entry-workspace";
import { billingEntryDefaults, billingEntrySchema } from "@/lib/schemas/billing-entry";

import { EntryAmountSection, EntryIdentitySection, EntryUnitsSection } from "./entry-form/EntryFormFields";
import { EntryPreview } from "./entry-form/EntryPreview";
import { useEntrySubmit } from "./entry-form/use-entry-submit";
import { useEntriesScope } from "./use-entries-scope";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { RecordForm } from "@/components/form/RecordForm";
import { useRecordForm } from "@/hooks/use-record-form";

function Form({ scope }: { scope: BillingEntriesScope }) {
  const router = useRouter();
  const methods = useRecordForm({ schema: billingEntrySchema, defaults: billingEntryDefaults(scope.condominium, monthFromApi(scope.month)) });
  // O lançamento criado abre ao lado da lista, no mês em que ele começa (que pode não ser o da lista).
  const { submit, isSubmitting } = useEntrySubmit(
    (entry) => router.push(billingEntryUrl(entry.id, { condominium: entry.condominium, month: entry.start_month })),
    methods.setError
  );

  return (
    <RecordForm methods={methods} onSubmit={submit} isSubmitting={isSubmitting} cancelHref={billingEntriesUrl(scope)} submitLabel="Incluir lançamento">
      <SectionAnchor id="lancamento">
        <EntryIdentitySection />
      </SectionAnchor>
      <SectionAnchor id="rateio">
        <EntryAmountSection />
      </SectionAnchor>
      <SectionAnchor id="unidades">
        <EntryUnitsSection />
      </SectionAnchor>
      <SectionAnchor id="valores">
        <EntryPreview />
      </SectionAnchor>
    </RecordForm>
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
