import { z } from "zod";

import type { Condominium } from "@/lib/api/generated/models";
import {
  decimalFromApi,
  maskCep,
  maskCnpj,
  moneyFromApi,
  onlyDigits,
} from "@/lib/masks";
import { isValidCnpj } from "@/lib/validators";

import {
  cepField,
  dateField,
  decimalField,
  enumField,
  intField,
  optionalText,
  requiredText,
  ufField,
} from "./fields";

const MAX_MONEY = 99_999_999.99; // numeric(10, 2)

/** CNPJ obrigatório; a saída são só os 14 dígitos, como o backend guarda. */
const cnpjField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Informe o CNPJ")
      .refine((value) => isValidCnpj(value), "CNPJ inválido. Confira os dígitos")
  )
  .transform((value) => onlyDigits(value));

type FeeInput = {
  fee_type: string;
  fee_amount?: string;
  fee_percentage?: string;
};

/** Taxa fixa exige valor; taxa variável exige percentual maior que zero. */
function feeError(values: FeeInput): { path: "fee_amount" | "fee_percentage"; message: string } | null {
  if (values.fee_type === "fixed" && values.fee_amount === undefined) {
    return { path: "fee_amount", message: "Informe o valor da taxa fixa" };
  }
  if (values.fee_type === "variable") {
    if (values.fee_percentage === undefined) {
      return { path: "fee_percentage", message: "Informe o percentual da taxa variável" };
    }
    if (Number(values.fee_percentage) === 0) {
      return { path: "fee_percentage", message: "O percentual deve ser maior que zero" };
    }
  }
  return null;
}

export const condominiumSchema = z
  .object({
    name: requiredText("o nome", { min: 2, max: 255 }),
    company: z.string().min(1, "Selecione a empresa administradora"),
    cnpj: cnpjField,
    municipal_registration: optionalText("Inscrição municipal", 30),
    type: enumField(["residential", "commercial"]),
    advisor: z.string().nullable(),
    active: z.boolean(),

    zip_code: cepField,
    street: optionalText("Logradouro", 255),
    number: optionalText("Número", 10),
    complement: optionalText("Complemento", 60),
    district: optionalText("Bairro", 120),
    city: optionalText("Cidade", 120),
    state: ufField,
    water_meter: optionalText("Hidrômetro", 30),
    electricity_meter: optionalText("Relógio de luz", 30),

    fee_type: enumField(["fixed", "variable"]),
    fee_amount: decimalField("Valor da taxa", { max: MAX_MONEY }),
    fee_percentage: decimalField("Percentual da taxa", { max: 100 }),
    fee_basis: enumField(["revenue", "expense"]),
    charges_iss_on_fee: z.boolean(),

    due_day: intField("Dia de vencimento", 1, 28),
    due_on_business_day: z.boolean(),
    calculation_period: enumField(["reference", "following"]),
    credit_limit: decimalField("Limite de crédito", { max: MAX_MONEY }),
    early_payment_discount_percentage: decimalField("Desconto", { max: 100 }),
    early_payment_discount_days: intField("Dias antes do vencimento", 0, 31),

    start_date: dateField("Data de início", { min: "1900-01-01", max: "2100-12-31" }),
    adjustment_base_date: dateField("Base do reajuste", {
      min: "1900-01-01",
      max: "2100-12-31",
    }),
    adjustment_period_months: intField("Periodicidade", 1, 120),
    adjustment_index: optionalText("Índice de reajuste", 30).transform((value) =>
      value?.toUpperCase()
    ),
  })
  // `when: () => true`: valida a taxa mesmo que outros campos já tenham falhado,
  // para o usuário ver todos os erros de uma vez.
  .refine((values) => feeError(values) === null, {
    path: ["fee_amount"],
    when: () => true,
    error: (issue) => feeError(issue.input as FeeInput)?.message ?? "Taxa inválida",
  });

export type CondominiumFormInput = z.input<typeof condominiumSchema>;
export type CondominiumFormOutput = z.output<typeof condominiumSchema>;

export const CONDOMINIUM_DEFAULTS: CondominiumFormInput = {
  name: "",
  company: "",
  cnpj: "",
  municipal_registration: "",
  type: "residential",
  advisor: null,
  active: true,
  zip_code: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  water_meter: "",
  electricity_meter: "",
  fee_type: "fixed",
  fee_amount: "",
  fee_percentage: "",
  fee_basis: "revenue",
  charges_iss_on_fee: false,
  due_day: "10",
  due_on_business_day: false,
  calculation_period: "reference",
  credit_limit: "",
  early_payment_discount_percentage: "",
  early_payment_discount_days: "0",
  start_date: "",
  adjustment_base_date: "",
  adjustment_period_months: "12",
  adjustment_index: "",
};

export function condominiumToForm(c: Condominium): CondominiumFormInput {
  const address = c.address;
  const contract = c.administration_contract;
  const billing = c.billing_rules;
  return {
    name: c.name,
    company: c.company,
    cnpj: c.cnpj ? maskCnpj(c.cnpj) : "",
    municipal_registration: c.municipal_registration ?? "",
    type: c.type ?? "residential",
    advisor: c.advisor ?? null,
    active: c.active ?? true,
    zip_code: address?.zip_code ? maskCep(address.zip_code) : "",
    street: address?.street ?? "",
    number: address?.number ?? "",
    complement: address?.complement ?? "",
    district: address?.district ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    water_meter: c.water_meter ?? "",
    electricity_meter: c.electricity_meter ?? "",
    fee_type: contract?.fee_type ?? "fixed",
    fee_amount: moneyFromApi(contract?.fee_amount),
    fee_percentage: decimalFromApi(contract?.fee_percentage, 2),
    fee_basis: contract?.fee_basis === "expense" ? "expense" : "revenue",
    charges_iss_on_fee: contract?.charges_iss_on_fee ?? false,
    due_day: String(billing?.due_day ?? 10),
    due_on_business_day: billing?.due_on_business_day ?? false,
    calculation_period: billing?.calculation_period ?? "reference",
    credit_limit: moneyFromApi(billing?.credit_limit),
    early_payment_discount_percentage: decimalFromApi(
      billing?.early_payment_discount_percentage,
      2
    ),
    early_payment_discount_days: String(billing?.early_payment_discount_days ?? 0),
    start_date: contract?.start_date ?? "",
    adjustment_base_date: contract?.adjustment_base_date ?? "",
    adjustment_period_months: String(contract?.adjustment_period_months ?? 12),
    adjustment_index: contract?.adjustment_index ?? "",
  };
}

const ADDRESS_KEYS = [
  "zip_code",
  "street",
  "number",
  "complement",
  "district",
  "city",
  "state",
] as const;

/**
 * Corpo da requisição no formato aninhado da API (endereço, contrato e regras de cobrança).
 * Na edição (PATCH) um campo esvaziado vai como `null`, senão o valor antigo permanece.
 */
export function condominiumToPayload(
  values: CondominiumFormOutput,
  isEdit: boolean
): Record<string, unknown> {
  const empty = isEdit ? null : undefined;
  const orEmpty = <T,>(value: T | undefined) => (value === undefined ? empty : value);

  const address = Object.fromEntries(
    ADDRESS_KEYS.map((key) => [key, orEmpty(values[key] ? onlyDigitsIf(key, values[key]) : undefined)])
  );
  const hasAddress = ADDRESS_KEYS.some((key) => values[key] !== undefined);

  const isFixed = values.fee_type === "fixed";

  return {
    company: values.company,
    advisor: values.advisor,
    type: values.type,
    name: values.name,
    cnpj: values.cnpj,
    municipal_registration: orEmpty(values.municipal_registration),
    water_meter: orEmpty(values.water_meter),
    electricity_meter: orEmpty(values.electricity_meter),
    active: values.active,
    ...(hasAddress ? { address } : {}),
    administration_contract: {
      fee_type: values.fee_type,
      fee_amount: isFixed ? values.fee_amount : null,
      fee_percentage: isFixed ? null : values.fee_percentage,
      fee_basis: isFixed ? null : values.fee_basis,
      charges_iss_on_fee: values.charges_iss_on_fee,
      start_date: values.start_date ?? null,
      adjustment_base_date: values.adjustment_base_date ?? null,
      adjustment_period_months: values.adjustment_period_months ?? 12,
      adjustment_index: values.adjustment_index ?? "",
    },
    billing_rules: {
      due_day: values.due_day ?? 10,
      due_on_business_day: values.due_on_business_day,
      calculation_period: values.calculation_period,
      credit_limit: values.credit_limit ?? "0.00",
      early_payment_discount_percentage: values.early_payment_discount_percentage ?? "0.00",
      early_payment_discount_days: values.early_payment_discount_days ?? 0,
    },
  };
}

/** O CEP vai só com dígitos (o backend guarda 8 caracteres); os demais campos seguem como estão. */
function onlyDigitsIf(key: (typeof ADDRESS_KEYS)[number], value: string) {
  return key === "zip_code" ? onlyDigits(value) : value;
}
