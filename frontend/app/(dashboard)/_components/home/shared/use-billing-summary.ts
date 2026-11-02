import { useBillingDocumentsSummary } from "@/lib/api/generated";
import type { BillingMonthSummary } from "@/lib/api/generated/models";

/** Quantos meses o gráfico mostra no cartão do painel e na visão ampliada ("ver"). */
export const CARD_CHART_MONTHS = 6;
export const FOCUS_CHART_MONTHS = 12;

/** Os boletos dos últimos meses (o do mês corrente é o último). */
export function useBillingSummary(months: number) {
  const query = useBillingDocumentsSummary({ months });
  const lines: BillingMonthSummary[] = query.data ?? [];
  return { ...query, lines, current: lines.at(-1) };
}
