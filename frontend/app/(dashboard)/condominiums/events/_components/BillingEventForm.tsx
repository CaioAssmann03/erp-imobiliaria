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
import { eventsUrl } from "@/lib/billing-event-workspace";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  BILLING_EVENT_DEFAULTS,
  billingEventSchema,
  billingEventToForm,
  type BillingEventFormInput,
  type BillingEventFormOutput,
} from "@/lib/schemas/billing-event";

import { BillingEventDeleteButton } from "./BillingEventDeleteButton";
import { useBillingEventSubmit } from "./billing-event-form/use-billing-event-submit";

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
        <div id="identificacao" className="scroll-mt-20">
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
        </div>
        <FormActions isSubmitting={isSubmitting} danger={event && <BillingEventDeleteButton billingEventId={event.id} name={event.name} />}>
          <Button type="button" variant="secondary" onClick={() => router.push(eventsUrl())}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
