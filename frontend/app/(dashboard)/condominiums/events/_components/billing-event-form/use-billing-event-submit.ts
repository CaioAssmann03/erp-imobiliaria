"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

import {
  getBillingEventsListQueryKey,
  getBillingEventsRetrieveQueryKey,
  useBillingEventsCreate,
  useBillingEventsPartialUpdate,
} from "@/lib/api/generated";
import type { BillingEvent } from "@/lib/api/generated/models";
import { eventUrl } from "@/lib/billing/billing-event-workspace";
import { applyServerErrors } from "@/lib/errors/form-errors";
import {
  billingEventToPayload,
  type BillingEventFormInput,
  type BillingEventFormOutput,
} from "@/lib/schemas/billing-event";
import { toast } from "@/lib/errors/toast";

export function useBillingEventSubmit(billingEventId: string | undefined, setError: UseFormSetError<BillingEventFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBillingEventsCreate();
  const updateMutation = useBillingEventsPartialUpdate();

  // Salvar uma edição deixa na página; cadastrar abre o evento novo (a lista ao lado já o mostra).
  const done = (message: string, id: string, opensEvent: boolean) => {
    queryClient.invalidateQueries({ queryKey: getBillingEventsListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getBillingEventsRetrieveQueryKey(id) });
    toast.success(message);
    if (opensEvent) router.push(eventUrl(id));
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: BillingEventFormOutput) => {
    const payload = billingEventToPayload(values);
    if (billingEventId !== undefined) {
      updateMutation.mutate(
        { id: billingEventId, data: payload as Partial<BillingEvent> },
        { onSuccess: () => done("Evento salvo.", billingEventId, false), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as BillingEvent },
        { onSuccess: (created) => done("Evento cadastrado.", created.id, true), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
