import { z } from "zod";

import { needsApportionmentCriterion, needsInstallments, type EntryValues } from "@/lib/billing-entry-payload";
import { currentMonthTyped, monthToApi } from "@/lib/billing-plan-payload";

import { decimalField, enumField } from "./fields";

const MAX_MONEY = 9_999_999_999.99; // numeric(12, 2)
const MAX_INSTALLMENTS = 120;

export const ALLOCATIONS = [
  { value: "individual", label: "Individual" },
  { value: "collective", label: "Coletivo" },
  { value: "fraction", label: "Fração" },
] as const;

export const RECURRENCES = [
  { value: "once", label: "Não repetir" },
  { value: "installments", label: "Parcelado" },
  { value: "always", label: "Sempre" },
] as const;

export const ALLOCATION_HINT =
  "Individual: o mesmo valor em cada unidade. Coletivo: um total dividido por igual entre as unidades. Fração: um total dividido pela fração de cada unidade no critério de rateio escolhido.";

export const billingEntrySchema = z
  .object({
    condominium: z.string().min(1, "Selecione o condomínio"),
    event: z.string(),
    credits_company: z.boolean(),
    description: z.string().trim().max(120, "A descrição deve ter no máximo 120 caracteres"),
    allocation: enumField(ALLOCATIONS.map((item) => item.value) as [string, ...string[]]),
    apportionment_criterion: z.string(),
    recurrence: enumField(RECURRENCES.map((item) => item.value) as [string, ...string[]]),
    installments_total: z.string(),
    // Mês e ano digitados ("10/2026"); vai à API como o primeiro dia do mês.
    start_month: z
      .string()
      .refine((value) => monthToApi(value) !== undefined, "Mês inválido. Use mês/ano, ex.: 10/2026")
      .transform((value) => monthToApi(value) as string),
    cost_center: z.string(),
    amount: decimalField("Valor", { max: MAX_MONEY, signed: true }),
    units: z
      .array(z.object({ unit: z.string(), amount: decimalField("Valor da unidade", { max: MAX_MONEY, signed: true }) }))
      .min(1, "Selecione ao menos uma unidade"),
  })
  .refine((entry) => entry.credits_company || entry.cost_center !== "", {
    path: ["cost_center"],
    message: "Selecione a sub-conta",
    when: () => true,
  })
  .refine((entry) => entry.amount !== undefined, { path: ["amount"], message: "Informe o valor", when: () => true })
  .refine((entry) => !entry.credits_company || Number(entry.amount) > 0, {
    path: ["amount"],
    message: "A tarifa da imobiliária não pode ser desconto",
    when: () => true,
  })
  .refine((entry) => !needsApportionmentCriterion(entry.allocation) || entry.apportionment_criterion !== "", {
    path: ["apportionment_criterion"],
    message: "Escolha o critério de rateio",
    when: () => true,
  })
  .refine(
    (entry) =>
      !needsInstallments(entry.recurrence) ||
      (Number.isInteger(Number(entry.installments_total)) &&
        Number(entry.installments_total) >= 2 &&
        Number(entry.installments_total) <= MAX_INSTALLMENTS),
    {
      path: ["installments_total"],
      message: `Informe de 2 a ${MAX_INSTALLMENTS} parcelas`,
      when: () => true,
    }
  );

export type BillingEntryFormInput = z.input<typeof billingEntrySchema>;
export type BillingEntryFormOutput = z.output<typeof billingEntrySchema>;

/** O formulário abre no condomínio e no mês que a grade está mostrando. */
export const billingEntryDefaults = (condominium: string, month = currentMonthTyped()): BillingEntryFormInput => ({
  condominium,
  event: "",
  credits_company: false,
  description: "",
  allocation: "individual",
  apportionment_criterion: "",
  recurrence: "once",
  installments_total: "",
  start_month: month,
  cost_center: "",
  amount: "",
  units: [],
});

/** O resultado validado do formulário no formato que a API e as funções puras usam. */
export const billingEntryFormToValues = (values: BillingEntryFormOutput): EntryValues => ({
  condominium: values.condominium,
  event: values.event,
  credits_company: values.credits_company,
  description: values.description,
  allocation: values.allocation as EntryValues["allocation"],
  apportionment_criterion: values.apportionment_criterion,
  recurrence: values.recurrence as EntryValues["recurrence"],
  installments_total: values.installments_total,
  start_month: values.start_month,
  cost_center: values.cost_center,
  amount: values.amount ?? "0",
  units: values.units.map((unit) => ({ unit: unit.unit, amount: unit.amount })),
});
