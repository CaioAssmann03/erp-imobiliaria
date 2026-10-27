import { z } from "zod";

import type { BillingEvent } from "@/lib/api/generated/models";

import { requiredText } from "./fields";

export const billingEventSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, "Informe o código (só números, até 6 dígitos)")
    .transform(Number),
  name: requiredText("o nome do evento", { max: 120 }),
  active: z.boolean(),
  credits_company: z.boolean(),
});

export type BillingEventFormInput = z.input<typeof billingEventSchema>;
export type BillingEventFormOutput = z.output<typeof billingEventSchema>;

export const BILLING_EVENT_DEFAULTS: BillingEventFormInput = { code: "", name: "", active: true, credits_company: false };

export const billingEventToForm = (event: BillingEvent): BillingEventFormInput => ({
  code: String(event.code),
  name: event.name,
  active: event.active ?? true,
  credits_company: event.credits_company ?? false,
});

export const billingEventToPayload = (values: BillingEventFormOutput): Record<string, unknown> => ({
  code: values.code,
  name: values.name,
  active: values.active,
  credits_company: values.credits_company,
});
