/**
 * O exemplo em datas que a tela de cobrança mostra, como o do Sami: dado o mês de referência
 * (o mês a que a emissão se refere), em que mês cai o vencimento e a qual mês o boleto se refere.
 * É a mesma tabela de `BillingRules.due_month_of` / `competence_month_of` do backend.
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

export type DueMonth = "reference" | "following";
export type CompetenceMonth = "same_as_due" | "before_due";

/** Um mês do calendário; `month` vai de 1 a 12. */
export interface YearMonth {
  year: number;
  month: number;
}

export function addMonths({ year, month }: YearMonth, months: number): YearMonth {
  const monthsSinceYearZero = year * 12 + (month - 1) + months;
  return { year: Math.floor(monthsSinceYearZero / 12), month: (((monthsSinceYearZero % 12) + 12) % 12) + 1 };
}

/** O vencimento cai no mês da referência ou no seguinte. */
export function dueMonthOf(reference: YearMonth, dueMonth: DueMonth): YearMonth {
  return addMonths(reference, dueMonth === "following" ? 1 : 0);
}

/** A competência é o mês do vencimento ou o mês anterior a ele. */
export function competenceMonthOf(
  reference: YearMonth,
  dueMonth: DueMonth,
  competenceMonth: CompetenceMonth
): YearMonth {
  return addMonths(dueMonthOf(reference, dueMonth), competenceMonth === "before_due" ? -1 : 0);
}

/** "11/2026" */
export function formatYearMonth({ year, month }: YearMonth): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

/** "Exemplo: referência 10/2026 → competência 11/2026, vencimento 11/2026." */
export function billingExample(
  reference: YearMonth,
  dueMonth: DueMonth,
  competenceMonth: CompetenceMonth
): string {
  const due = formatYearMonth(dueMonthOf(reference, dueMonth));
  const competence = formatYearMonth(competenceMonthOf(reference, dueMonth, competenceMonth));
  return `Exemplo: referência ${formatYearMonth(reference)} → competência ${competence}, vencimento ${due}.`;
}
