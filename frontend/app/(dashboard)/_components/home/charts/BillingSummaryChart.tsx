"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { brl } from "@/lib/format/format";
import type { BillingMonthSummary } from "@/lib/api/generated/models";

import { longMonthLabel, shortMonthLabel } from "@/app/(dashboard)/_components/home/widgets/format";

const config = {
  paid: { label: "Boletos recebidos", color: "var(--color-brand)" },
  open: { label: "Boletos em aberto", color: "var(--color-ink-faint)" },
} satisfies ChartConfig;

/**
 * Client Component: uma barra horizontal por mês (gráfico do shadcn). O comprimento é o que foi emitido, dividido no que já foi recebido
 * (cor de destaque) e no que segue em aberto (cinza), com a porcentagem recebida no fim: dá para comparar o tamanho dos meses e quanto de
 * cada um já entrou.
 */
export function BillingSummaryChart({ lines, className = "h-52 w-full" }: { lines: readonly BillingMonthSummary[]; className?: string }) {
  const data = lines.map((line) => {
    const issued = Number(line.issued_total);
    const paid = Number(line.paid_total);
    return {
      label: shortMonthLabel(line.reference_month.slice(0, 7)),
      tooltipLabel: longMonthLabel(line.reference_month.slice(0, 7)),
      paid,
      open: Math.max(issued - paid, 0),
      share: issued > 0 ? Math.round((paid / issued) * 100) : 0,
    };
  });

  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 0 }} barCategoryGap="26%">
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={36} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} />
        <ChartTooltip
          cursor={{ fill: "var(--color-surface-muted)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel}
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-ink-soft">{config[name as keyof typeof config]?.label}</span>
                  <span className="font-medium tabular-nums">{brl(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="paid" stackId="month" fill="var(--color-paid)" radius={[4, 0, 0, 4]} />
        <Bar dataKey="open" stackId="month" fill="var(--color-open)" fillOpacity={0.4} radius={[0, 4, 4, 0]}>
          <LabelList dataKey="share" position="right" formatter={(value) => `${value}%`} className="fill-ink-soft text-[11px] tabular-nums" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
