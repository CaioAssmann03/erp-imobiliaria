"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BillingSummaryChart } from "@/components/charts/BillingSummaryChart";
import { CARD_CHART_MONTHS, useBillingSummary } from "@/app/(dashboard)/_components/home/shared/use-billing-summary";

/** Client Component: o gráfico dos últimos 6 meses no cartão do painel (a visão ampliada, ao clicar em "ver", mostra os 12). */
export function BillingChartBody() {
  const { lines, isLoading } = useBillingSummary(CARD_CHART_MONTHS);
  if (isLoading) return <Skeleton className="h-52 rounded-panel" />;
  return <BillingSummaryChart lines={lines} />;
}
