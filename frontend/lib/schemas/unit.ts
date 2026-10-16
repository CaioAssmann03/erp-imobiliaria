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

/** As seis frações ideais da unidade, com o nome do campo na API; a 1ª é a principal, as outras são opcionais. */
export const UNIT_FRACTIONS = [
  { name: "ideal_fraction", label: "1ª fração" },
  { name: "ideal_fraction_2", label: "2ª fração" },
  { name: "ideal_fraction_3", label: "3ª fração" },
  { name: "ideal_fraction_4", label: "4ª fração" },
  { name: "ideal_fraction_5", label: "5ª fração" },
  { name: "ideal_fraction_6", label: "6ª fração" },
] as const;

// numeric(9, 8): fração de 0 a 1, usada no rateio das despesas
const idealFraction = (label: string) =>
  decimalField(label, { max: 1, decimals: 8 }).refine(
    (value) => value === undefined || Number(value) > 0,
    `A ${label.toLowerCase()} deve ser maior que zero`
  );

export const unitSchema = z.object({
  name: requiredText("a unidade", { max: 30 }),
  block: z.string().transform((value) => (value ? value : null)),
  type: enumField(UNIT_TYPES.map((t) => t.value) as [string, ...string[]]),
  registration_number: optionalText("Matrícula do imóvel", 60),
  resident_count: intField("Nº de moradores", 0, 999),
  ideal_fraction: idealFraction("1ª fração"),
  ideal_fraction_2: idealFraction("2ª fração"),
  ideal_fraction_3: idealFraction("3ª fração"),
  ideal_fraction_4: idealFraction("4ª fração"),
  ideal_fraction_5: idealFraction("5ª fração"),
  ideal_fraction_6: idealFraction("6ª fração"),
  is_manager_unit: z.boolean(),
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
  ideal_fraction: "",
  ideal_fraction_2: "",
  ideal_fraction_3: "",
  ideal_fraction_4: "",
  ideal_fraction_5: "",
  ideal_fraction_6: "",
  is_manager_unit: false,
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
    ideal_fraction: decimalFromApi(u.ideal_fraction, 8),
    ideal_fraction_2: decimalFromApi(u.ideal_fraction_2, 8),
    ideal_fraction_3: decimalFromApi(u.ideal_fraction_3, 8),
    ideal_fraction_4: decimalFromApi(u.ideal_fraction_4, 8),
    ideal_fraction_5: decimalFromApi(u.ideal_fraction_5, 8),
    ideal_fraction_6: decimalFromApi(u.ideal_fraction_6, 8),
    is_manager_unit: u.is_manager_unit ?? false,
    is_billing_blocked: u.is_billing_blocked ?? false,
    active: u.active ?? true,
    gas_value: moneyFromApi(u.gas_value),
    water_value: moneyFromApi(u.water_value),
    electricity_value: moneyFromApi(u.electricity_value),
  };
}

/** Corpo da requisição; na edição (PATCH) um campo esvaziado vai como `null` / "" para limpar. */
export function unitToPayload(
  values: UnitFormOutput,
  condominiumId: string,
  isEdit: boolean
): Record<string, unknown> {
  const empty = isEdit ? null : undefined;
  return {
    condominium: condominiumId,
    block: values.block,
    name: values.name,
    type: values.type,
    registration_number: values.registration_number ?? (isEdit ? "" : undefined),
    resident_count: values.resident_count,
    ideal_fraction: values.ideal_fraction ?? empty,
    ideal_fraction_2: values.ideal_fraction_2 ?? empty,
    ideal_fraction_3: values.ideal_fraction_3 ?? empty,
    ideal_fraction_4: values.ideal_fraction_4 ?? empty,
    ideal_fraction_5: values.ideal_fraction_5 ?? empty,
    ideal_fraction_6: values.ideal_fraction_6 ?? empty,
    is_manager_unit: values.is_manager_unit,
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
