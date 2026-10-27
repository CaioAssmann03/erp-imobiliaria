import { z } from "zod";

import type { BillingPlan, BillingPlanItem } from "@/lib/api/generated/models";
import { monthFromApi, monthToApi, needsAmount, needsApportionmentCriterion, needsUnitValueField } from "@/lib/billing-plan-payload";
import { moneyFromApi } from "@/lib/masks";

import { decimalField, enumField, requiredText } from "./fields";

const MAX_MONEY = 9_999_999_999.99; // numeric(12, 2)

export const CALCULATION_KINDS = [
  { value: "fixed_amount", label: "Valor fixo por unidade" },
  { value: "ideal_fraction_share", label: "Rateio por fração ideal" },
  { value: "unit_registered_value", label: "Valor cadastrado da unidade" },
] as const;

export const UNIT_VALUE_FIELDS = [
  { value: "gas", label: "Gás" },
  { value: "water", label: "Água" },
  { value: "electricity", label: "Energia elétrica" },
] as const;

/** Mês e ano digitados ("03/2026"), opcional; vai à API como o primeiro dia do mês. */
const monthField = (label: string) =>
  z
    .string()
    .refine((value) => value === "" || monthToApi(value) !== undefined, `${label} inválido. Use mês/ano, ex.: 03/2026`)
    .transform(monthToApi);

export const billingPlanItemSchema = z
  .object({
    description: requiredText("a descrição", { max: 120 }),
    cost_center: z.string().min(1, "Selecione a sub-conta"),
    entry_template: z.string().min(1, "Selecione o modelo de lançamento"),
    calculation_kind: enumField(CALCULATION_KINDS.map((item) => item.value) as [string, ...string[]]),
    amount: decimalField("Valor", { min: 0.01, max: MAX_MONEY }),
    apportionment_criterion: z.string(),
    unit_value_field: z.string(),
  })
  .refine((item) => !needsAmount(item.calculation_kind) || item.amount !== undefined, {
    path: ["amount"],
    message: "Informe o valor",
    when: () => true,
  })
  .refine((item) => !needsApportionmentCriterion(item.calculation_kind) || item.apportionment_criterion !== "", {
    path: ["apportionment_criterion"],
    message: "Escolha o critério de rateio",
    when: () => true,
  })
  .refine((item) => !needsUnitValueField(item.calculation_kind) || item.unit_value_field !== "", {
    path: ["unit_value_field"],
    message: "Escolha o valor da unidade",
    when: () => true,
  });

export const billingPlanSchema = z
  .object({
    condominium: z.string().min(1, "Selecione o condomínio"),
    name: requiredText("o nome", { max: 120 }),
    active: z.boolean(),
    start_month: monthField("Mês inicial"),
    end_month: monthField("Mês final"),
    items: z.array(billingPlanItemSchema).min(1, "Adicione ao menos um item"),
  })
  .refine((plan) => !plan.start_month || !plan.end_month || plan.end_month >= plan.start_month, {
    path: ["end_month"],
    message: "O mês final não pode ser anterior ao mês inicial",
    when: () => true,
  });

export type BillingPlanFormInput = z.input<typeof billingPlanSchema>;
export type BillingPlanFormOutput = z.output<typeof billingPlanSchema>;
export type BillingPlanItemFormInput = z.input<typeof billingPlanItemSchema>;

export const EMPTY_PLAN_ITEM: BillingPlanItemFormInput = {
  description: "",
  cost_center: "",
  entry_template: "",
  calculation_kind: "fixed_amount",
  amount: "",
  apportionment_criterion: "",
  unit_value_field: "",
};

export const BILLING_PLAN_DEFAULTS: BillingPlanFormInput = {
  condominium: "",
  name: "",
  active: true,
  start_month: "",
  end_month: "",
  items: [EMPTY_PLAN_ITEM],
};

const itemToForm = (item: BillingPlanItem): BillingPlanItemFormInput => ({
  description: item.description ?? "",
  cost_center: item.cost_center,
  entry_template: item.entry_template,
  calculation_kind: item.calculation_kind,
  amount: moneyFromApi(item.amount),
  apportionment_criterion: item.apportionment_criterion ?? "",
  unit_value_field: item.unit_value_field ?? "",
});

export const billingPlanToForm = (plan: BillingPlan): BillingPlanFormInput => ({
  condominium: plan.condominium,
  name: plan.name,
  active: plan.active ?? true,
  start_month: monthFromApi(plan.start_month),
  end_month: monthFromApi(plan.end_month),
  items: plan.items.map(itemToForm),
});

export { planToPayload as billingPlanToPayload } from "@/lib/billing-plan-payload";
