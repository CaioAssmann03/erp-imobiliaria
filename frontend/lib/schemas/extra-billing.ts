import { z } from "zod";

import { currentMonthTyped, monthToApi } from "@/lib/billing-plan-payload";
import { newLine, type ExtraValues } from "@/lib/extra-billing-payload";
import { addDays, todayIso } from "@/lib/format";
import { isValidIsoDate } from "@/lib/validators";

import { ALLOCATIONS } from "./billing-entry";
import { decimalField, enumField } from "./fields";

const MAX_MONEY = 9_999_999_999.99; // numeric(12, 2)
const DEFAULT_DUE_IN_DAYS = 7;

const lineSchema = z
  .object({
    event: z.string(),
    credits_company: z.boolean(),
    description: z.string().trim().max(120, "A descrição deve ter no máximo 120 caracteres"),
    allocation: enumField(ALLOCATIONS.map((item) => item.value) as [string, ...string[]]),
    apportionment_criterion: z.string(),
    cost_center: z.string(),
    amount: decimalField("Valor", { max: MAX_MONEY, signed: true }),
  })
  .refine((line) => line.credits_company || line.cost_center !== "", {
    path: ["cost_center"],
    message: "Selecione a sub-conta",
    when: () => true,
  })
  .refine((line) => line.amount !== undefined, { path: ["amount"], message: "Informe o valor", when: () => true })
  .refine((line) => !line.credits_company || Number(line.amount) > 0, {
    path: ["amount"],
    message: "A tarifa da imobiliária não pode ser desconto",
    when: () => true,
  })
  .refine((line) => line.allocation !== "fraction" || line.apportionment_criterion !== "", {
    path: ["apportionment_criterion"],
    message: "Escolha o critério de rateio",
    when: () => true,
  });

export const extraBillingSchema = z.object({
  condominium: z.string().min(1, "Selecione o condomínio"),
  // Mês e ano digitados ("10/2026"); vai à API como o primeiro dia do mês.
  competence_month: z
    .string()
    .refine((value) => monthToApi(value) !== undefined, "Mês inválido. Use mês/ano, ex.: 10/2026")
    .transform((value) => monthToApi(value) as string),
  due_date: z.string().refine(isValidIsoDate, "Data inválida"),
  // O mesmo seletor da Inclusão de valores guarda `{unit, amount}`; aqui só o `unit` vale.
  units: z.array(z.object({ unit: z.string(), amount: z.string() })).min(1, "Selecione ao menos uma unidade"),
  lines: z.array(lineSchema).min(1, "Inclua ao menos um valor"),
});

export type ExtraBillingFormInput = z.input<typeof extraBillingSchema>;
export type ExtraBillingFormOutput = z.output<typeof extraBillingSchema>;

export const extraBillingDefaults = (): ExtraBillingFormInput => ({
  condominium: "",
  competence_month: currentMonthTyped(),
  due_date: addDays(todayIso(), DEFAULT_DUE_IN_DAYS),
  units: [],
  lines: [newLine()],
});

/** O resultado validado do formulário no formato que as funções puras usam. */
export const extraBillingFormToValues = (values: ExtraBillingFormOutput): ExtraValues => ({
  condominium: values.condominium,
  competence_month: values.competence_month,
  due_date: values.due_date,
  units: values.units.map((item) => item.unit),
  lines: values.lines.map((line) => ({
    event: line.event,
    credits_company: line.credits_company,
    description: line.description,
    allocation: line.allocation as ExtraValues["lines"][number]["allocation"],
    apportionment_criterion: line.apportionment_criterion,
    cost_center: line.cost_center,
    amount: line.amount ?? "0",
  })),
});
