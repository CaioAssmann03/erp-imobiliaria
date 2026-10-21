import { z } from "zod";

import { monthToApi } from "@/lib/billing-plan-payload";

/** Emitir o mês de um condomínio: o mês vem de um `<input type="month">` e vai como o primeiro dia dele. */
export const issueMonthSchema = z.object({
  condominium: z.string().min(1, "Selecione o condomínio"),
  reference_month: z
    .string()
    .refine((value) => monthToApi(value) !== undefined, "Informe o mês de referência")
    .transform((value) => monthToApi(value) as string),
});

export type IssueMonthFormInput = z.input<typeof issueMonthSchema>;
export type IssueMonthFormOutput = z.output<typeof issueMonthSchema>;
