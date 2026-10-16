import { z } from "zod";

import { dateField, decimalField } from "./fields";

/** Uma taxa de juros: percentual ao mês a partir de uma data de início. */
export const lateInterestRateSchema = z
  .object({
    start_date: dateField("Início", { min: "1900-01-01", max: "2100-12-31" }),
    monthly_percentage: decimalField("Taxa", { max: 100 }),
  })
  // `when: () => true`: mostra os dois avisos de uma vez, mesmo que um campo já tenha falhado.
  .refine((values) => values.start_date !== undefined, {
    path: ["start_date"],
    when: () => true,
    error: "Informe o início da vigência",
  })
  .refine((values) => values.monthly_percentage !== undefined, {
    path: ["monthly_percentage"],
    when: () => true,
    error: "Informe a taxa",
  });

export type LateInterestRateFormInput = z.input<typeof lateInterestRateSchema>;
export type LateInterestRateFormOutput = z.output<typeof lateInterestRateSchema>;

export const LATE_INTEREST_RATE_DEFAULTS: LateInterestRateFormInput = {
  start_date: "",
  monthly_percentage: "",
};
