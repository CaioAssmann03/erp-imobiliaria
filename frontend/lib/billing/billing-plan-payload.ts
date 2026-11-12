/**
 * O que o formulário do plano de cobrança envia à API: meses, itens e o corpo do plano.
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

export type CalculationKind = "fixed_amount" | "ideal_fraction_share" | "unit_registered_value";

export interface PlanItemValues {
  /** Id do evento ("" = sem evento): o boleto abre a linha com "0052-NOME" e a descrição vem depois. */
  event: string;
  /** Vazio quando o evento basta (`undefined`). */
  description: string | undefined;
  cost_center: string;
  entry_template: string;
  calculation_kind: string;
  /** Valor da API ("450.00"); `undefined` quando vazio. */
  amount: string | undefined;
  /** Id do critério de rateio do condomínio, no rateio; "" nos outros tipos. */
  apportionment_criterion: string;
  /** `gas`, `water` ou `electricity` para o valor cadastrado; "" nos outros tipos. */
  unit_value_field: string;
}

export interface PlanValues {
  condominium: string;
  name: string;
  active: boolean;
  /** Primeiro dia do mês ("2026-03-01"); `undefined` quando vazio. */
  start_month: string | undefined;
  end_month: string | undefined;
  items: PlanItemValues[];
}

/** Mês digitado ("03/2026"; "2026-03" também vale) → primeiro dia do mês ("2026-03-01"); vazio ou inválido → undefined. */
export function monthToApi(value: string): string | undefined {
  const typed = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(value);
  if (typed) return `${typed[2]}-${typed[1]}-01`;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${value}-01` : undefined;
}

/** Data da API ("2026-03-01") → mês como o usuário digita ("03/2026"). */
export function monthFromApi(value: string | null | undefined): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  return `${month}/${year}`;
}

/** Máscara de "mês/ano" enquanto digita: "032026" → "03/2026" (só dígitos, a barra entra sozinha). */
export function maskMonthYear(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** O mês de hoje no formato digitado ("10/2026"). */
export function currentMonthTyped(today: Date = new Date()): string {
  return `${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
}

/** Fixo e rateio levam valor; o valor cadastrado da unidade não. */
export const needsAmount = (kind: string): boolean => kind !== "unit_registered_value";
export const needsApportionmentCriterion = (kind: string): boolean => kind === "ideal_fraction_share";
export const needsUnitValueField = (kind: string): boolean => kind === "unit_registered_value";

/** Um item para a API: só os campos do tipo de cálculo escolhido; os outros vão `null`. */
export function itemToPayload(item: PlanItemValues): Record<string, unknown> {
  return {
    event: item.event || null,
    description: item.description ?? "",
    cost_center: item.cost_center,
    entry_template: item.entry_template,
    calculation_kind: item.calculation_kind,
    amount: needsAmount(item.calculation_kind) ? (item.amount ?? null) : null,
    apportionment_criterion: needsApportionmentCriterion(item.calculation_kind) ? item.apportionment_criterion : null,
    unit_value_field: needsUnitValueField(item.calculation_kind) ? item.unit_value_field : null,
  };
}

/**
 * Corpo do plano. A lista de itens substitui a do plano e vale na ordem enviada. O condomínio de um plano
 * existente não muda (PATCH sem ele).
 */
export function planToPayload(values: PlanValues, isEdit: boolean): Record<string, unknown> {
  return {
    ...(isEdit ? {} : { condominium: values.condominium }),
    name: values.name,
    active: values.active,
    start_month: values.start_month ?? null,
    end_month: values.end_month ?? null,
    items: values.items.map(itemToPayload),
  };
}

/** Caminho de um erro da API (`items.2.amount`) no nome do campo do formulário (os itens usam os mesmos nomes). */
export function planErrorPath(path: string): string {
  if (/^items\.\d+\./.test(path)) return path;
  const names = path.split(".").filter((name) => !/^\d+$/.test(name));
  return names[names.length - 1] ?? path;
}

const MONTH_ABBREVIATIONS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-03-01" → "mar/2026". */
const monthLabel = (value: string): string => {
  const [year, month] = value.split("-");
  return `${MONTH_ABBREVIATIONS[Number(month) - 1]}/${year}`;
};

/** A vigência de um plano em texto: "Sem prazo", "a partir de mar/2026", "até dez/2026" ou "mar/2026 a dez/2026". */
export function describeValidity(start: string | null | undefined, end: string | null | undefined): string {
  if (start && end) return `${monthLabel(start)} a ${monthLabel(end)}`;
  if (start) return `a partir de ${monthLabel(start)}`;
  if (end) return `até ${monthLabel(end)}`;
  return "Sem prazo";
}
