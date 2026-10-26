"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField, TextField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useBillingEventsRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  BILLING_EVENT_DEFAULTS,
  billingEventSchema,
  billingEventToForm,
  type BillingEventFormInput,
  type BillingEventFormOutput,
} from "@/lib/schemas/billing-event";

import { BILLING_EVENTS_URL, useBillingEventSubmit } from "./billing-event-form/use-billing-event-submit";

/** Cadastro e edição de um evento (código e nome). */
export function BillingEventForm({ billingEventId }: { billingEventId?: string }) {
  const router = useRouter();
  const isEdit = billingEventId !== undefined;
  const { data: event, isLoading, error: loadError } = useBillingEventsRetrieve(billingEventId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfNotFound(loadError);

  const methods = useForm<BillingEventFormInput, unknown, BillingEventFormOutput>({
    resolver: zodResolver(billingEventSchema),
    defaultValues: BILLING_EVENT_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useBillingEventSubmit(billingEventId, setError);

  useEffect(() => {
    if (event) reset(billingEventToForm(event));
  }, [event, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        <FormSection title="Identificação">
          <TextField name="code" label="Código" required inputMode="numeric" maxLength={6} placeholder="Ex.: 250" autoComplete="off" />
          <TextField name="name" label="Nome do evento" required maxLength={120} placeholder="Ex.: Limpeza do condomínio" autoComplete="off" />
          <FieldRow>
            <CheckboxField name="active" label="Cadastro ativo" />
          </FieldRow>
        </FormSection>
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push(BILLING_EVENTS_URL)}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
