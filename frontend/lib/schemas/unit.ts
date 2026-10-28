import { z } from "zod";

import type { Unit } from "@/lib/api/generated/models";
import { decimalFromApi, moneyFromApi } from "@/lib/masks";

import {
  dateField,
  decimalField,
  enumField,
  intField,
  optionalText,
  requiredText,
} from "./fields";

const MAX_MONEY = 999_999.99; // numeric(8, 2)

/** Quem recebe o boleto da unidade (o proprietário é o pagador quando não há inquilino atual). */
export const BILLING_RECIPIENTS = [
  { value: "owner", label: "Proprietário" },
  { value: "tenant", label: "Inquilino" },
] as const;

export const UNIT_TYPES = [
  { value: "apartment", label: "Apartamento" },
  { value: "office", label: "Sala" },
  { value: "store", label: "Loja" },
  { value: "house", label: "Casa" },
  { value: "suite", label: "Conjunto" },
  { value: "parking_space", label: "Box" },
  { value: "other", label: "Outros" },
] as const;

export const unitTypeLabel = (type: string | undefined) =>
  UNIT_TYPES.find((item) => item.value === type)?.label ?? type ?? "";

// numeric(9, 8): fração de 0 a 1, usada no rateio das despesas
const idealFraction = decimalField("Fração", { max: 1, decimals: 8 }).refine(
  (value) => value === undefined || Number(value) > 0,
  "A fração deve ser maior que zero"
);

export const unitSchema = z.object({
  name: requiredText("a unidade", { max: 30 }),
  block: z.string().transform((value) => (value ? value : null)),
  type: enumField(UNIT_TYPES.map((t) => t.value) as [string, ...string[]]),
  registration_number: optionalText("Matrícula do imóvel", 60),
  resident_count: intField("Nº de moradores", 0, 999),
  /** Fração da unidade em cada critério de rateio do condomínio, por id do critério; vazio = sem fração ali. */
  fractions: z.record(z.string(), idealFraction),
  is_manager_unit: z.boolean(),
  billing_recipient: enumField(BILLING_RECIPIENTS.map((item) => item.value) as [string, ...string[]]),
  is_billing_blocked: z.boolean(),
  active: z.boolean(),
  gas_value: decimalField("Valor do gás", { max: MAX_MONEY }),
  water_value: decimalField("Valor da água", { max: MAX_MONEY }),
  electricity_value: decimalField("Valor da energia", { max: MAX_MONEY }),
});

export type UnitFormInput = z.input<typeof unitSchema>;
export type UnitFormOutput = z.output<typeof unitSchema>;

export const UNIT_DEFAULTS: UnitFormInput = {
  name: "",
  block: "",
  type: "apartment",
  registration_number: "",
  resident_count: "0",
  fractions: {},
  is_manager_unit: false,
  billing_recipient: "owner",
  is_billing_blocked: false,
  active: true,
  gas_value: "",
  water_value: "",
  electricity_value: "",
};

export function unitToForm(u: Unit): UnitFormInput {
  return {
    name: u.name,
    block: u.block ?? "",
    type: u.type ?? "apartment",
    registration_number: u.registration_number ?? "",
    resident_count: String(u.resident_count ?? 0),
    fractions: Object.fromEntries(
      (u.fractions ?? []).map((fraction) => [fraction.criterion, decimalFromApi(fraction.value, 8)])
    ),
    is_manager_unit: u.is_manager_unit ?? false,
    billing_recipient: u.billing_recipient ?? "owner",
    is_billing_blocked: u.is_billing_blocked ?? false,
    active: u.active ?? true,
    gas_value: moneyFromApi(u.gas_value),
    water_value: moneyFromApi(u.water_value),
    electricity_value: moneyFromApi(u.electricity_value),
  };
}

/**
 * A lista de frações da unidade: só os critérios preenchidos. Na edição ela sempre vai, mesmo vazia,
 * porque enviar a lista substitui o conjunto (é assim que uma fração é removida); na criação, sem
 * frações, a lista é omitida.
 */
export function fractionsToPayload(
  fractions: Record<string, string | undefined>,
  isEdit: boolean
): { criterion: string; value: string }[] | undefined {
  const filled = Object.entries(fractions).flatMap(([criterion, value]) =>
    value === undefined ? [] : [{ criterion, value }]
  );
  return isEdit || filled.length > 0 ? filled : undefined;
}

/** Corpo da requisição; na edição (PATCH) um campo esvaziado vai como `null` / "" para limpar. */
export function unitToPayload(
  values: UnitFormOutput,
  condominiumId: string,
  isEdit: boolean
): Record<string, unknown> {
  return {
    condominium: condominiumId,
    block: values.block,
    name: values.name,
    type: values.type,
    registration_number: values.registration_number ?? (isEdit ? "" : undefined),
    resident_count: values.resident_count,
    fractions: fractionsToPayload(values.fractions, isEdit),
    is_manager_unit: values.is_manager_unit,
    billing_recipient: values.billing_recipient,
    is_billing_blocked: values.is_billing_blocked,
    active: values.active,
    gas_value: values.gas_value,
    water_value: values.water_value,
    electricity_value: values.electricity_value,
  };
}

/** Vínculo de uma pessoa com a unidade (proprietário ou locatário). */
export const unitPersonSchema = z
  .object({
    role: enumField(["owner", "tenant"], "Selecione o papel"),
    ownership_percentage: decimalField("Percentual", { max: 100 }),
    start_date: dateField("Início da vigência", { min: "1900-01-01", max: "2100-12-31" }),
    end_date: dateField("Fim da vigência", { min: "1900-01-01", max: "2100-12-31" }),
  })
  .refine((values) => values.start_date !== undefined, {
    path: ["start_date"],
    when: () => true,
    error: "Informe o início da vigência",
  })
  .refine((values) => values.role !== "owner" || values.ownership_percentage !== undefined, {
    path: ["ownership_percentage"],
    when: () => true,
    error: "Informe a participação do proprietário",
  })
  .refine(
    (values) =>
      !values.start_date || !values.end_date || values.end_date >= values.start_date,
    {
      path: ["end_date"],
      when: () => true,
      error: "O fim não pode ser anterior ao início",
    }
  );

export type UnitPersonFormInput = z.input<typeof unitPersonSchema>;
export type UnitPersonFormOutput = z.output<typeof unitPersonSchema>;

export const UNIT_PERSON_DEFAULTS: UnitPersonFormInput = {
  role: "owner",
  ownership_percentage: "100,00",
  start_date: "",
  end_date: "",
};
