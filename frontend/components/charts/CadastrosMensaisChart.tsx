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

const config = {
  condominios: { label: "Condomínios", color: "var(--color-brand)" },
  unidades: { label: "Unidades", color: "var(--color-ink)" },
  pessoas: { label: "Pessoas", color: "var(--color-ink-faint)" },
} satisfies ChartConfig;

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

/** Client Component: novos cadastros por mês, empilhados (últimos 6 meses). */
export function CadastrosMensaisChart({
  data,
  className = "h-56 w-full",
}: {
  data: { mes: string; condominios: number; unidades: number; pessoas: number }[];
  className?: string;
}) {
  return (
    <ChartContainer config={config} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-surface-sunken)" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={monthLabel}
          tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(value) => monthLabel(String(value))} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {(["pessoas", "unidades", "condominios"] as const).map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="cadastros"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={key === "condominios" ? 0.85 : key === "unidades" ? 0.8 : 0.35}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
