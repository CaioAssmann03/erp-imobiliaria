"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { brl } from "@/lib/format";
import type { BillingMonthSummary } from "@/lib/api/generated/models";

import { longMonthLabel, shortMonthLabel } from "./widgets/format";

const config = {
  issued: { label: "Emitido", color: "var(--color-ink-faint)" },
  paid: { label: "Recebido", color: "var(--color-brand)" },
} satisfies ChartConfig;

/**
 * Client Component: duas áreas sobrepostas (gráfico do shadcn), o que foi emitido (cinza, atrás) e o que foi recebido (cor de destaque, na
 * frente) em cada mês: o vão entre elas é o que ainda não entrou.
 */
export function BillingSummaryChart({ lines, className = "h-52 w-full" }: { lines: readonly BillingMonthSummary[]; className?: string }) {
  const data = lines.map((line) => ({
    label: shortMonthLabel(line.reference_month.slice(0, 7)),
    tooltipLabel: longMonthLabel(line.reference_month.slice(0, 7)),
    issued: Number(line.issued_total),
    paid: Number(line.paid_total),
  }));

  return (
    <ChartContainer config={config} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          {(["issued", "paid"] as const).map((key) => (
            <linearGradient key={key} id={`billing-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${key})`} stopOpacity={key === "paid" ? 0.4 : 0.22} />
              <stop offset="100%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-surface-sunken)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} />
        <YAxis hide domain={[0, (max: number) => Math.max(max, 1)]} />
        <ChartTooltip
          cursor={{ stroke: "var(--color-ink-faint)", strokeDasharray: "3 3" }}
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
        <Area type="monotone" dataKey="issued" stroke="var(--color-issued)" strokeWidth={1.5} fill="url(#billing-fill-issued)" dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2} fill="url(#billing-fill-paid)" dot={{ r: 3, fill: "var(--color-paid)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ChartContainer>
  );
}
