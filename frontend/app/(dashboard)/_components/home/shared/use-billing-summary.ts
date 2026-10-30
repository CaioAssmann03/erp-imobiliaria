import { useBillingDocumentsSummary } from "@/lib/api/generated";
import type { BillingMonthSummary } from "@/lib/api/generated/models";

/** Os boletos dos últimos meses (o do mês corrente é o último). */
export function useBillingSummary(months: number) {
  const query = useBillingDocumentsSummary({ months });
  const lines: BillingMonthSummary[] = query.data ?? [];
  return { ...query, lines, current: lines.at(-1) };
}
