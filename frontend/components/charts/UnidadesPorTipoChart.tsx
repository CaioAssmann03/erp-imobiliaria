"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  total: { label: "Unidades", color: "var(--color-brand)" },
} satisfies ChartConfig;

/** Client Component: gráfico interativo (tooltip) — dados vêm do servidor. */
export function UnidadesPorTipoChart({
  data,
  className = "h-40 w-full",
  fullLabels = false,
}: {
  data: { tipo: string; rotulo: string; total: number }[];
  className?: string;
  fullLabels?: boolean;
}) {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-surface-sunken)" />
        <XAxis
          dataKey="rotulo"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          tickFormatter={(value: string) => (fullLabels ? value : value.slice(0, 3))}
          tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ChartContainer>
  );
}
