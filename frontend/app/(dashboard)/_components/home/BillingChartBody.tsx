"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { BillingSummaryChart } from "./BillingSummaryChart";
import { useBillingSummary } from "./use-billing-summary";

/** Client Component: o gráfico dos últimos 6 meses no painel. */
export function BillingChartBody() {
  const { lines, isLoading } = useBillingSummary(6);
  if (isLoading) return <Skeleton className="h-52 rounded-panel" />;
  return <BillingSummaryChart lines={lines} />;
}
