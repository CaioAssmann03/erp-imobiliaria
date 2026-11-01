"use client";

import { CheckboxField, TextField } from "@/components/form/fields";

import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";

import { useBillingEventsRetrieve } from "@/lib/api/generated";
import { eventsUrl } from "@/lib/billing/billing-event-workspace";
import { throwIfPageError } from "@/lib/query/page-error";
import { BILLING_EVENT_DEFAULTS, billingEventSchema, billingEventToForm } from "@/lib/schemas/billing-event";

import { BillingEventDeleteButton } from "./BillingEventDeleteButton";
import { useBillingEventSubmit } from "./billing-event-form/use-billing-event-submit";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de um evento (código e nome). */
export function BillingEventForm({ billingEventId }: { billingEventId?: string }) {
  const isEdit = billingEventId !== undefined;
  const { data: event, isLoading, error: loadError } = useBillingEventsRetrieve(billingEventId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfPageError(loadError);

  const methods = useRecordForm({ schema: billingEventSchema, defaults: BILLING_EVENT_DEFAULTS, record: event, toForm: billingEventToForm });
  const { submit, isSubmitting } = useBillingEventSubmit(billingEventId, methods.setError);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={eventsUrl()}
      danger={event && <BillingEventDeleteButton billingEventId={event.id} name={event.name} />}
    >
      <SectionAnchor id="identificacao">
        <FormSection title="Identificação">
          <TextField
            name="code"
            label="Código"
            inputMode="numeric"
            maxLength={6}
            placeholder="Automático"
            hint="O número pelo qual a equipe conhece o evento (ex.: 250 = Limpeza do condomínio). Em branco, o sistema dá o menor número livre (1, 2, 3…), pulando os que já existem."
            autoComplete="off"
          />
          <TextField name="name" label="Nome do evento" required maxLength={120} placeholder="Ex.: Limpeza do condomínio" autoComplete="off" />
          <FieldRow>
            <CheckboxField name="active" label="Cadastro ativo" />
            <CheckboxField
              name="credits_company"
              label="Receita da imobiliária"
              hint="Marque para a tarifa de registro bancário (ex.: 0005 TARIFA BANCO). O valor lançado com este evento cai na conta da imobiliária, nunca na conta de um condomínio, e o lançamento não tem sub-conta."
            />
          </FieldRow>
        </FormSection>
      </SectionAnchor>
    </RecordForm>
  );
}
