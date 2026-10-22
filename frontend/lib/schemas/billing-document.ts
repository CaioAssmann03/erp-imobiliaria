import { z } from "zod";

import { dateField } from "./fields";

const requiredDate = (label: string) =>
  dateField(label).refine((value) => value !== undefined, `Informe ${label.toLowerCase()}`);

/** O novo vencimento da reemissão do boleto (o servidor recusa data no passado). */
export const reissueBillingDocumentSchema = z.object({
  due_date: requiredDate("Novo vencimento"),
});

export type ReissueBillingDocumentFormInput = z.input<typeof reissueBillingDocumentSchema>;
export type ReissueBillingDocumentFormOutput = z.output<typeof reissueBillingDocumentSchema>;
