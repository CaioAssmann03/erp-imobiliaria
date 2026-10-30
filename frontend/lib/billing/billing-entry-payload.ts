/**
 * O que a tela "Inclusão de valores" envia à API e como monta a grade do mês.
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

export type Allocation = "individual" | "collective" | "fraction";
export type Recurrence = "once" | "installments" | "always";

export interface EntryUnitValues {
  unit: string;
  /** Valor próprio da unidade ("80.00"), só no rateio individual; `undefined` = o valor do lançamento. */
  amount: string | undefined;
}

export interface EntryValues {
  condominium: string;
  /** Id do evento; "" = sem evento. */
  event: string;
  /** O evento escolhido é da imobiliária (a tarifa): sem sub-conta, o dinheiro nunca vai para o condomínio. */
  credits_company: boolean;
  description: string;
  allocation: Allocation;
  /** Id do critério de rateio no rateio por fração; "" nos outros. */
  apportionment_criterion: string;
  recurrence: Recurrence;
  /** Número de parcelas ("12") no parcelado; "" nos outros. */
  installments_total: string;
  /** Primeiro dia do mês ("2026-10-01"). */
  start_month: string;
  cost_center: string;
  /** Valor da API ("100.00"). */
  amount: string;
  units: EntryUnitValues[];
}

export const needsApportionmentCriterion = (allocation: string): boolean => allocation === "fraction";
export const needsInstallments = (recurrence: string): boolean => recurrence === "installments";

/** O corpo do lançamento: só os campos do rateio e da recorrência escolhidos; os outros vão `null`. */
export function entryToPayload(values: EntryValues): Record<string, unknown> {
  return {
    condominium: values.condominium,
    event: values.event || null,
    description: values.description,
    allocation: values.allocation,
    apportionment_criterion: needsApportionmentCriterion(values.allocation) ? values.apportionment_criterion : null,
    recurrence: values.recurrence,
    installments_total: needsInstallments(values.recurrence) ? Number(values.installments_total) : null,
    start_month: values.start_month,
    cost_center: values.credits_company ? null : values.cost_center,
    amount: values.amount,
    units: values.units.map((unit) => ({
      unit: unit.unit,
      amount: values.allocation === "individual" ? (unit.amount ?? null) : null,
    })),
  };
}

/** Já dá para pedir a pré-visualização dos valores à API (o resto das regras é do backend). */
export function canPreview(values: EntryValues): boolean {
  if (!values.condominium || (!values.credits_company && !values.cost_center) || !values.start_month || values.units.length === 0) return false;
  // Um desconto (valor negativo) também tem pré-visualização; só zero e vazio não têm.
  if (!Number.isFinite(Number(values.amount)) || Number(values.amount) === 0) return false;
  if (needsApportionmentCriterion(values.allocation) && values.apportionment_criterion === "") return false;
  if (needsInstallments(values.recurrence) && !(Number(values.installments_total) >= 2)) return false;
  return true;
}

export interface CostCenterLike {
  id: string;
  /** A API sempre devolve o código; o schema gerado o marca como opcional porque o cadastro pode omiti-lo. */
  code?: number;
  active?: boolean;
}

/** A sub-conta já escolhida ao abrir o formulário: a de código 0 (Conta Normal) ou, sem ela, a primeira ativa. */
export function defaultCostCenterId(costCenters: readonly CostCenterLike[]): string {
  const active = costCenters.filter((costCenter) => costCenter.active !== false);
  return (active.find((costCenter) => costCenter.code === 0) ?? active[0])?.id ?? "";
}

/** Código de uma sub-conta como a equipe o conhece ("0002"). */
export const formatCode = (code: number | undefined, digits = 4): string => String(code ?? 0).padStart(digits, "0");

export interface EntryUnitAmount {
  unit: string;
  unit_name: string;
  amount: string;
}

export interface EntryOfMonth {
  id: string;
  month: { unit_amounts: readonly EntryUnitAmount[] } | null | undefined;
}

export interface GridRow {
  unit: string;
  unit_name: string;
  /** Valor da unidade em cada lançamento (por id), em reais com 2 casas; vazio quando não participa. */
  amounts: Record<string, string>;
  total: string;
}

const toCents = (value: string): number => Math.round(Number(value) * 100);
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/** "2" < "10" (e "A2" < "A10"): o nome da unidade ordena como gente lê. */
const byUnitName = (a: string, b: string): number => a.localeCompare(b, "pt-BR", { numeric: true });

/** A grade do mês: uma linha por unidade que aparece em algum lançamento, com o total; somas em centavos. */
export function buildGrid(entries: readonly EntryOfMonth[]): { rows: GridRow[]; entryTotals: Record<string, string>; grandTotal: string } {
  const rows = new Map<string, GridRow & { cents: number }>();
  const entryCents: Record<string, number> = {};
  for (const entry of entries) {
    for (const item of entry.month?.unit_amounts ?? []) {
      const cents = toCents(item.amount);
      const row = rows.get(item.unit) ?? { unit: item.unit, unit_name: item.unit_name, amounts: {}, total: "0.00", cents: 0 };
      row.amounts[entry.id] = fromCents(cents);
      row.cents += cents;
      rows.set(item.unit, row);
      entryCents[entry.id] = (entryCents[entry.id] ?? 0) + cents;
    }
  }
  const sorted = [...rows.values()].sort((a, b) => byUnitName(a.unit_name, b.unit_name));
  return {
    rows: sorted.map(({ cents, ...row }) => ({ ...row, total: fromCents(cents) })),
    entryTotals: Object.fromEntries(Object.entries(entryCents).map(([id, cents]) => [id, fromCents(cents)])),
    grandTotal: fromCents(sorted.reduce((sum, row) => sum + row.cents, 0)),
  };
}

export interface EntryHeaderSource {
  event_credits_company?: boolean;
  event_name?: string | null;
  description?: string;
  month: { line_description: string; installment: string } | null | undefined;
}

/** O que a coluna mostra no cabeçalho: a linha do boleto ("0005-TARIFA BANCO - 10/2026") e a parcela ("2/3"), se houver. */
export function entryColumnTitle(entry: EntryHeaderSource): { title: string; installment: string } {
  const title = entry.month?.line_description || [entry.event_name, entry.description].filter(Boolean).join(" - ");
  return { title, installment: entry.month?.installment ?? "" };
}
