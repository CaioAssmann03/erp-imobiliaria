"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const config = {
  with: { label: "Com responsável", color: "var(--color-brand)" },
  without: { label: "Sem responsável", color: "var(--color-surface-sunken)" },
} satisfies ChartConfig;

/** Client Component: rosca (gráfico do shadcn) com a cobertura das unidades ativas; no meio, a porcentagem. */
export function ResponsiblesDonut({ covered, total }: { covered: number; total: number }) {
  const data = [
    { key: "with", name: "Com responsável", value: covered },
    { key: "without", name: "Sem responsável", value: Math.max(total - covered, 0) },
  ];
  const percent = total > 0 ? Math.round((covered / total) * 100) : 0;

  return (
    <ChartContainer config={config} className="mx-auto h-44 w-full">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" strokeWidth={0} startAngle={90} endAngle={-270}>
          {data.map((item) => (
            <Cell key={item.key} fill={`var(--color-${item.key})`} />
          ))}
          <Label
            content={({ viewBox }) =>
              viewBox && "cx" in viewBox && "cy" in viewBox ? (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-ink text-2xl font-medium tabular-nums">
                    {percent}%
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-ink-soft text-xs">
                    {covered} de {total}
                  </tspan>
                </text>
              ) : null
            }
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
