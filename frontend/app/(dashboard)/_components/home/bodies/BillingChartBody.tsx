"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BillingSummaryChart } from "@/app/(dashboard)/_components/home/charts/BillingSummaryChart";
import { useBillingSummary } from "@/app/(dashboard)/_components/home/shared/use-billing-summary";

/** Client Component: o gráfico dos últimos 12 meses no painel (a visão ampliada usa os mesmos 12). */
export function BillingChartBody() {
  const { lines, isLoading } = useBillingSummary(12);
  if (isLoading) return <Skeleton className="h-52 rounded-panel" />;
  return <BillingSummaryChart lines={lines} />;
}
