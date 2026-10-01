"use client";

import { Pie, PieChart } from "recharts";

import { cn } from "@/lib/utils";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  fisica: { label: "Pessoa física", color: "var(--color-ink)" },
  juridica: { label: "Pessoa jurídica", color: "var(--color-brand)" },
} satisfies ChartConfig;

/** Client Component: rosca de pessoas por tipo, com o total no centro. */
export function PessoasPorTipoChart({
  fisica,
  juridica,
  large = false,
}: {
  fisica: number;
  juridica: number;
  large?: boolean;
}) {
  const total = fisica + juridica;
  const data =
    total === 0
      ? [{ tipo: "vazio", total: 1, fill: "var(--color-surface-sunken)" }]
      : [
          { tipo: "fisica", total: fisica, fill: "var(--color-fisica)" },
          { tipo: "juridica", total: juridica, fill: "var(--color-juridica)" },
        ];

  return (
    <div>
      <div className={cn("relative mx-auto", large ? "h-64 w-64" : "h-40 w-40")}>
        <ChartContainer config={config} className="size-full">
          <PieChart>
            {total > 0 && (
              <ChartTooltip content={<ChartTooltipContent nameKey="tipo" hideLabel />} />
            )}
            <Pie
              data={data}
              dataKey="total"
              nameKey="tipo"
              innerRadius={large ? 82 : 50}
              outerRadius={large ? 120 : 74}
              paddingAngle={total > 0 ? 3 : 0}
              cornerRadius={6}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-title tabular-nums">{total}</span>
          <span className="text-caption text-ink-soft">pessoas</span>
        </div>
      </div>

      <ul className="mt-3 flex justify-center gap-5 whitespace-nowrap">
        {(["fisica", "juridica"] as const).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: `var(--color-${key === "fisica" ? "ink" : "brand"})` }}
            />
            <span className="text-ink-soft">{key === "fisica" ? "Física" : "Jurídica"}</span>
            <span className="tabular-nums">{key === "fisica" ? fisica : juridica}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
