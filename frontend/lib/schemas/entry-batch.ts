import { z } from "zod";

import { dateField, decimalField, enumField, intField, requiredText } from "./fields";

const MAX_MONEY = 9_999_999_999.99; // numeric(12, 2)

export const BATCH_ORIGINS = [
  { value: "bank", label: "Banco" },
  { value: "cash", label: "Caixa" },
  { value: "extra_cash", label: "Caixa extra" },
] as const;

export const ENTRY_KINDS = [
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
] as const;

const requiredDate = (label: string) =>
  dateField(label).refine((value) => value !== undefined, `Informe ${label.toLowerCase()}`);

/** Competência digitada em `<input type="month">` ("2026-10") → primeiro dia do mês ("2026-10-01"). */
const competenceField = z
  .string()
  .refine((value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value), "Informe a competência")
  .transform((value) => `${value}-01`);

export const entryLineSchema = z.object({
  condominium: z.string().min(1, "Selecione o condomínio"),
  entry_template: z.string().min(1, "Selecione o modelo de lançamento"),
  cost_center: z.string().min(1, "Selecione a sub-conta"),
  kind: enumField(ENTRY_KINDS.map((item) => item.value) as [string, ...string[]]),
  amount: decimalField("Valor", { min: 0.01, max: MAX_MONEY }).refine((value) => value !== undefined, "Informe o valor"),
  entry_date: requiredDate("Data"),
  competence_month: competenceField,
  description: requiredText("a descrição", { max: 255 }),
});

export const entriesBatchSchema = z
  .object({
    batch_date: requiredDate("Data do lote"),
    origin: enumField(BATCH_ORIGINS.map((item) => item.value) as [string, ...string[]]),
    cash_number: intField("Número do caixa", 1, 2_147_483_647),
    lines: z.array(entryLineSchema).min(1, "Adicione ao menos um lançamento"),
  })
  .refine((values) => values.origin === "bank" || values.cash_number !== undefined, {
    path: ["cash_number"],
    message: "Informe o número do caixa",
    when: () => true,
  });

export type EntriesBatchFormInput = z.input<typeof entriesBatchSchema>;
export type EntriesBatchFormOutput = z.output<typeof entriesBatchSchema>;
export type EntryLineFormInput = z.input<typeof entryLineSchema>;

export const EMPTY_ENTRY_LINE: EntryLineFormInput = {
  condominium: "",
  entry_template: "",
  cost_center: "",
  kind: "debit",
  amount: "",
  entry_date: "",
  competence_month: "",
  description: "",
};

export const entriesBatchDefaults = (today: string): EntriesBatchFormInput => ({
  batch_date: today,
  origin: "bank",
  cash_number: "",
  lines: [{ ...EMPTY_ENTRY_LINE, entry_date: today, competence_month: today.slice(0, 7) }],
});

/** Corpo do lote: caixa e caixa extra levam o número; banco não. */
export const entryBatchToPayload = (values: EntriesBatchFormOutput): Record<string, unknown> => ({
  batch_date: values.batch_date,
  origin: values.origin,
  ...(values.origin === "bank" ? {} : { cash_number: values.cash_number }),
});

/** Uma linha do lote; `currentAccount` é a conta corrente do condomínio da linha. */
export const entryLineToPayload = (
  line: EntriesBatchFormOutput["lines"][number],
  currentAccount: string
): Record<string, unknown> => ({
  current_account: currentAccount,
  entry_template: line.entry_template,
  cost_center: line.cost_center,
  kind: line.kind,
  amount: line.amount,
  entry_date: line.entry_date,
  competence_month: line.competence_month,
  description: line.description,
});

/** Motivo e data do estorno de um lançamento. */
export const reverseEntrySchema = z.object({
  reason: requiredText("o motivo", { max: 2000 }),
  reversal_date: requiredDate("Data do estorno"),
});

export type ReverseEntryFormInput = z.input<typeof reverseEntrySchema>;
export type ReverseEntryFormOutput = z.output<typeof reverseEntrySchema>;
