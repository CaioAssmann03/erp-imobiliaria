"use client";

import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import {
  getBillingEventsListQueryKey,
  getBillingEventsRetrieveQueryKey,
  useBillingEventsCreate,
  useBillingEventsPartialUpdate,
} from "@/lib/api/generated";
import type { BillingEvent } from "@/lib/api/generated/models";
import { eventUrl } from "@/lib/billing/billing-event-workspace";
import { billingEventToPayload, type BillingEventFormInput, type BillingEventFormOutput } from "@/lib/schemas/billing-event";

/** Salvar uma edição deixa na página; cadastrar abre o evento novo (a lista ao lado já o mostra). */
export function useBillingEventSubmit(billingEventId: string | undefined, setError: UseFormSetError<BillingEventFormInput>) {
  return useRecordSubmit<BillingEventFormInput, BillingEventFormOutput, BillingEvent>({
    recordId: billingEventId,
    setError,
    toPayload: billingEventToPayload,
    create: useBillingEventsCreate(),
    update: useBillingEventsPartialUpdate(),
    invalidate: (id) => [getBillingEventsListQueryKey(), getBillingEventsRetrieveQueryKey(id)],
    messages: { updated: "Evento salvo.", created: "Evento cadastrado." },
    redirect: (event, created) => (created ? eventUrl(event.id) : undefined),
  });
}
