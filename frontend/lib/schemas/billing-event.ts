import { z } from "zod";

import type { BillingEvent } from "@/lib/api/generated/models";

import { requiredText } from "./fields";

export const billingEventSchema = z.object({
  /** Vazio: o sistema dá o próximo código livre (o último da empresa + 1). */
  code: z
    .string()
    .trim()
    .regex(/^\d{0,6}$/, "Use só números, até 6 dígitos")
    .transform((value) => (value === "" ? undefined : Number(value))),
  name: requiredText("o nome do evento", { max: 120 }),
  active: z.boolean(),
  credits_company: z.boolean(),
});

export type BillingEventFormInput = z.input<typeof billingEventSchema>;
export type BillingEventFormOutput = z.output<typeof billingEventSchema>;

export const BILLING_EVENT_DEFAULTS: BillingEventFormInput = { code: "", name: "", active: true, credits_company: false };

export const billingEventToForm = (event: BillingEvent): BillingEventFormInput => ({
  code: event.code === undefined ? "" : String(event.code),
  name: event.name,
  active: event.active ?? true,
  credits_company: event.credits_company ?? false,
});

export const billingEventToPayload = (values: BillingEventFormOutput): Record<string, unknown> => ({
  ...(values.code === undefined ? {} : { code: values.code }),
  name: values.name,
  active: values.active,
  credits_company: values.credits_company,
});
