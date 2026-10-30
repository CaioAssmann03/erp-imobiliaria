import { z } from "zod";

import type { AccountPayable } from "@/lib/api/generated/models";
import { moneyFromApi } from "@/lib/format/masks";

import { dateField, decimalField, enumField, optionalText, requiredText } from "./fields";

const MAX_MONEY = 9_999_999_999.99; // numeric(12, 2)

export const PAYABLE_HOLDERS = [
  { value: "condominium", label: "Despesa de um condomínio" },
  { value: "company", label: "Despesa da empresa" },
] as const;

export const PAYMENT_METHODS = [
  { value: "boleto", label: "Boleto" },
  { value: "pix", label: "Pix" },
  { value: "automatic_debit", label: "Débito automático" },
  { value: "transfer", label: "Transferência" },
] as const;

export const paymentMethodLabel = (method: string) =>
  PAYMENT_METHODS.find((item) => item.value === method)?.label ?? method;

export const PAYABLE_STATUSES = [
  { value: "open", label: "Em aberto" },
  { value: "paid", label: "Paga" },
  { value: "cancelled", label: "Cancelada" },
] as const;

export const payableStatusLabel = (status: string) =>
  PAYABLE_STATUSES.find((item) => item.value === status)?.label ?? status;

const requiredMoney = (label: string) =>
  decimalField(label, { min: 0.01, max: MAX_MONEY }).refine((value) => value !== undefined, `Informe ${label.toLowerCase()}`);

const requiredDate = (label: string) =>
  dateField(label).refine((value) => value !== undefined, `Informe ${label.toLowerCase()}`);

export const accountPayableSchema = z
  .object({
    holder: enumField(PAYABLE_HOLDERS.map((item) => item.value) as [string, ...string[]]),
    condominium: z.string(),
    cost_center: z.string(),
    entry_template: z.string(),
    supplier: z.string().min(1, "Selecione o fornecedor"),
    description: requiredText("a descrição", { max: 255 }),
    document_number: optionalText("Documento", 60),
    amount: requiredMoney("Valor"),
    issue_date: dateField("Emissão"),
    due_date: requiredDate("Vencimento"),
  })
  .refine((values) => values.holder !== "condominium" || values.condominium !== "", {
    path: ["condominium"],
    message: "Selecione o condomínio",
    when: () => true,
  })
  .refine((values) => values.holder !== "condominium" || values.cost_center !== "", {
    path: ["cost_center"],
    message: "Selecione a sub-conta",
    when: () => true,
  })
  .refine((values) => !values.issue_date || !values.due_date || values.due_date >= values.issue_date, {
    path: ["due_date"],
    message: "O vencimento não pode ser anterior à emissão",
    when: () => true,
  });

export type AccountPayableFormInput = z.input<typeof accountPayableSchema>;
export type AccountPayableFormOutput = z.output<typeof accountPayableSchema>;

export const ACCOUNT_PAYABLE_DEFAULTS: AccountPayableFormInput = {
  holder: "condominium",
  condominium: "",
  cost_center: "",
  entry_template: "",
  supplier: "",
  description: "",
  document_number: "",
  amount: "",
  issue_date: "",
  due_date: "",
};

export const accountPayableToForm = (account: AccountPayable): AccountPayableFormInput => ({
  holder: account.condominium ? "condominium" : "company",
  condominium: account.condominium ?? "",
  cost_center: account.cost_center ?? "",
  entry_template: account.entry_template ?? "",
  supplier: account.supplier,
  description: account.description,
  document_number: account.document_number ?? "",
  amount: moneyFromApi(account.amount),
  issue_date: account.issue_date ?? "",
  due_date: account.due_date,
});

/** Corpo da requisição; na edição (PATCH) um campo esvaziado vai como `null` / "" para limpar. */
export function accountPayableToPayload(values: AccountPayableFormOutput, isEdit: boolean): Record<string, unknown> {
  const isCondominiumExpense = values.holder === "condominium";
  const empty = isEdit ? null : undefined;
  return {
    supplier: values.supplier,
    condominium: isCondominiumExpense ? values.condominium : empty,
    cost_center: isCondominiumExpense ? values.cost_center : empty,
    entry_template: isCondominiumExpense && values.entry_template ? values.entry_template : empty,
    description: values.description,
    document_number: values.document_number ?? (isEdit ? "" : undefined),
    amount: values.amount,
    issue_date: values.issue_date ?? empty,
    due_date: values.due_date,
  };
}

/** Dados da baixa (pagamento) de uma conta em aberto. */
export const settleAccountPayableSchema = z.object({
  payment_date: requiredDate("Data do pagamento"),
  amount_paid: requiredMoney("Valor pago"),
  payment_method: enumField(PAYMENT_METHODS.map((item) => item.value) as [string, ...string[]]),
});

export type SettleAccountPayableFormInput = z.input<typeof settleAccountPayableSchema>;
export type SettleAccountPayableFormOutput = z.output<typeof settleAccountPayableSchema>;
