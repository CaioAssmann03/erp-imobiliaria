"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getBillingEventsListQueryKey,
  getBillingEventsRetrieveQueryKey,
  useBillingEventsCreate,
  useBillingEventsPartialUpdate,
} from "@/lib/api/generated";
import type { BillingEvent } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import {
  billingEventToPayload,
  type BillingEventFormInput,
  type BillingEventFormOutput,
} from "@/lib/schemas/billing-event";

export const BILLING_EVENTS_URL = "/billing/events";

export function useBillingEventSubmit(billingEventId: string | undefined, setError: UseFormSetError<BillingEventFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBillingEventsCreate();
  const updateMutation = useBillingEventsPartialUpdate();

  const done = (message: string, id: string) => {
    queryClient.invalidateQueries({ queryKey: getBillingEventsListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getBillingEventsRetrieveQueryKey(id) });
    toast.success(message);
    router.push(BILLING_EVENTS_URL);
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: BillingEventFormOutput) => {
    const payload = billingEventToPayload(values);
    if (billingEventId !== undefined) {
      updateMutation.mutate(
        { id: billingEventId, data: payload as Partial<BillingEvent> },
        { onSuccess: () => done("Evento salvo.", billingEventId), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as BillingEvent },
        { onSuccess: (created) => done("Evento cadastrado.", created.id), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
