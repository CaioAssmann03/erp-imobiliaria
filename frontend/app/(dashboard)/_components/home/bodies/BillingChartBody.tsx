"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { BillingSummaryChart } from "@/app/(dashboard)/_components/home/charts/BillingSummaryChart";
import { useBillingSummary } from "@/app/(dashboard)/_components/home/shared/use-billing-summary";

/** Client Component: o gráfico dos últimos 6 meses no painel. */
export function BillingChartBody() {
  const { lines, isLoading } = useBillingSummary(6);
  if (isLoading) return <Skeleton className="h-52 rounded-panel" />;
  return <BillingSummaryChart lines={lines} />;
}
