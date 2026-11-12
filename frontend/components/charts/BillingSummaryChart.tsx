"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart";
import type { BillingMonthSummary } from "@/lib/api/generated/models";
import { brl, longMonthLabel, shortMonthLabel } from "@/lib/format/format";

const config = {
  issued: { label: "Boletos emitidos", color: "var(--color-ink-faint)" },
  paid: { label: "Boletos recebidos", color: "var(--color-brand)" },
  open: { label: "Em aberto", color: "var(--color-ink-faint)" },
} satisfies ChartConfig;

type Row = { label: string; tooltipLabel: string; issued: number; paid: number; open: number; gap: [number, number] };

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

const TARGET_TICKS = 3;
const oneDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Eixo Y que se ajusta à escala dos dados em vez de começar em zero: com valores altos e parecidos, partir de zero deixa as curvas coladas no
 * topo e esconde a variação. O passo do eixo (1, 2, 5 × 10ⁿ) sai da própria faixa dos valores, então valores baixos têm degraus pequenos e
 * valores altos, grandes, sempre em números redondos. Se o menor valor é menos da metade do maior, a variação já aparece e o eixo parte de zero.
 */
function fitAxis(values: readonly number[]): { domain: [number, number]; ticks: number[] } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || max <= 0) return { domain: [0, 1], ticks: [0, 1] };

  const pad = Math.max((max - min) * 0.25, max * 0.02);
  const low = min < max * 0.5 ? 0 : min - pad;
  const rawStep = (max + pad - low) / TARGET_TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const ratio = rawStep / magnitude;
  const step = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * magnitude;

  const start = Math.max(0, Math.floor(low / step) * step);
  const end = Math.ceil((max + pad) / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick <= end + step / 2; tick += step) ticks.push(tick);
  return { domain: [start, end], ticks };
}

function Legend() {
  return (
    <div className="flex items-center justify-center gap-5 pt-3 text-xs text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-[2px] bg-brand" />
        Recebido
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-[2px] bg-ink-faint/50" />
        {config.open.label}
      </span>
    </div>
  );
}

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const rate = row.issued > 0 ? (row.paid / row.issued) * 100 : null;
  const items = [
    { label: config.issued.label, value: row.issued },
    { label: config.paid.label, value: row.paid },
    { label: config.open.label, value: row.open },
  ];
  return (
    <div className="grid min-w-52 gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium first-letter:uppercase">{row.tooltipLabel}</div>
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <span className="text-ink-soft">{label}</span>
          <span className="font-medium tabular-nums">{brl(value)}</span>
        </div>
      ))}
      {rate !== null && (
        <div className="flex items-center justify-between gap-4 border-t pt-1.5">
          <span className="text-ink-soft">Recebido do emitido</span>
          <span className="font-semibold tabular-nums">{oneDecimal.format(rate)}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Client Component: duas curvas suaves por mês (gráfico de área do shadcn). A área de destaque é o que já foi recebido e a faixa clara por cima
 * dela, até a curva do emitido, é o que segue em aberto (uma área de intervalo entre as duas curvas). A faixa tem legenda e valor
 * no tooltip, para a diferença entre os dois aparecer como número e não só como espaço entre linhas. Um ponto por mês, grade só horizontal e
 * valores abreviados no eixo. O eixo Y se ajusta à escala dos valores (`fitAxis`), para a variação aparecer tanto com valores baixos quanto altos.
 */
export function BillingSummaryChart({ lines, className = "h-52 w-full" }: { lines: readonly BillingMonthSummary[]; className?: string }) {
  // Os meses anteriores à primeira emissão chegam da API com zeros e ficam assim: a curva sobe de zero até o primeiro mês com boletos.
  const data: Row[] = lines.map((line) => {
    const issued = Number(line.issued_total);
    const paid = Number(line.paid_total);
    return {
      label: shortMonthLabel(line.reference_month.slice(0, 7)),
      tooltipLabel: longMonthLabel(line.reference_month.slice(0, 7)),
      issued,
      paid,
      open: Math.max(issued - paid, 0),
      gap: [paid, Math.max(issued, paid)],
    };
  });

  const { domain, ticks } = fitAxis(data.flatMap((item) => [item.issued, item.paid]));

  return (
    <ChartContainer config={config} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tickMargin={6} tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} />
        <YAxis width={44} domain={domain} ticks={ticks} tickLine={false} axisLine={false} tickFormatter={(value) => compact.format(value)} tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} />
        <ChartTooltip cursor={{ stroke: "var(--color-border)" }} content={<Tip />} />
        <ChartLegend content={<Legend />} />
        {/* A faixa em aberto é uma área de intervalo (do recebido ao emitido), não empilhada: empilhar força o eixo a partir de zero. */}
        <Area type="monotone" dataKey="gap" stroke="none" fill="var(--color-open)" fillOpacity={0.22} dot={false} activeDot={false} legendType="none" />
        <Area type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2.5} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="issued" stroke="var(--color-issued)" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 3.5, strokeWidth: 0 }} />
      </AreaChart>
    </ChartContainer>
  );
}
