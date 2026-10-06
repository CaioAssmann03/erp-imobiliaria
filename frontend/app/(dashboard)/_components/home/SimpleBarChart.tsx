"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  value: { label: "Valor", color: "var(--color-brand)" },
} satisfies ChartConfig;

const NARROW = "(max-width: 640px)";
function useNarrow() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(NARROW);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(NARROW).matches,
    () => false
  );
}

function formatValue(value: number, format: "number" | "currency") {
  return format === "currency"
    ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : String(value);
}

export interface BarDatum {
  label: string;
  value: number;
  /** Texto completo no tooltip (padrão: o próprio label). */
  tooltipLabel?: string;
}

/**
 * Client Component: barras no estilo do painel (cor de destaque, sem eixos pesados).
 * `horizontal` troca para barras deitadas, boas para rótulos longos (nomes).
 */
export function SimpleBarChart({
  data,
  className = "h-40 w-full",
  horizontal = false,
  format = "number",
  highlightFirst = false,
}: {
  data: BarDatum[];
  className?: string;
  horizontal?: boolean;
  /** Como mostrar o valor no tooltip (texto simples: funções não cruzam servidor → cliente). */
  format?: "number" | "currency";
  /** Destaca a 1ª barra (ex.: "atrasados") com a cor do texto: contrasta com qualquer cor de destaque. */
  highlightFirst?: boolean;
}) {
  const narrow = useNarrow();

  return (
    <ChartContainer config={config} className={className}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: horizontal ? 8 : 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          vertical={horizontal}
          horizontal={!horizontal}
          stroke="var(--color-surface-sunken)"
        />
        {horizontal ? (
          <>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={narrow ? 105 : 190}
              tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
              tickFormatter={(value: string) => (value.length > (narrow ? 16 : 30) ? `${value.slice(0, narrow ? 15 : 29)}…` : value)}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
            />
            <YAxis hide allowDecimals={false} />
          </>
        )}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.tooltipLabel ?? payload?.[0]?.payload?.label
              }
              formatter={(value) => <span className="font-medium tabular-nums">{formatValue(Number(value), format)}</span>}
            />
          }
        />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
          maxBarSize={horizontal ? 14 : 22}
        >
          {data.map((item, index) => (
            <Cell
              key={item.label}
              fill={highlightFirst && index === 0 ? "var(--color-ink)" : "var(--color-value)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
