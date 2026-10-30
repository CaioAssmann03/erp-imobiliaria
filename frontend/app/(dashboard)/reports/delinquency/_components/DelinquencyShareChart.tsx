"use client";

import { Popover } from "@base-ui/react/popover";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

const config = {
  value: { label: "Valor" },
} satisfies ChartConfig;

/** Até quantos condomínios a rosca é a melhor leitura; acima disso as fatias não se distinguem e vale o ranking. */
const DONUT_MAX = 8;
/** Quantos condomínios ganham fatia (ou linha) própria; o resto fica em "Outros" (rosca) ou em "Ver todos" (ranking). */
const TOP = 5;
/** Opacidade da cor de destaque em cada fatia, da maior para a menor: um tom só, o do tema (laranja ou o personalizado). */
const SHADES = [100, 75, 55, 40, 28, 18];
const OTHERS = "others";

export interface DelinquencyShareLine {
  condominium_id: string;
  condominium_name: string;
  total_amount: string;
}

interface Entry {
  id: string;
  name: string;
  value: number;
  percent: string;
}

interface Slice extends Entry {
  color: string;
  /** Só em "Outros": os condomínios que ele junta. */
  rest?: Entry[];
}

function percentLabel(value: number, total: number) {
  if (total <= 0) return "";
  const percent = (value / total) * 100;
  return percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

function toEntries(lines: DelinquencyShareLine[], total: number): Entry[] {
  return [...lines]
    .sort((a, b) => Number(b.total_amount) - Number(a.total_amount))
    .map((line) => ({
      id: line.condominium_id,
      name: line.condominium_name,
      value: Number(line.total_amount),
      percent: percentLabel(Number(line.total_amount), total),
    }));
}

function buildSlices(entries: Entry[], total: number): Slice[] {
  const head = entries.length > TOP + 1 ? entries.slice(0, TOP) : entries;
  const rest = entries.slice(head.length);
  const slices: Slice[] = head.map((entry, index) => ({
    ...entry,
    color: `color-mix(in oklab, var(--color-brand) ${SHADES[index]}%, transparent)`,
  }));
  if (rest.length > 0) {
    const value = rest.reduce((sum, entry) => sum + entry.value, 0);
    slices.push({
      id: OTHERS,
      name: `Outros (${rest.length})`,
      value,
      percent: percentLabel(value, total),
      color: `color-mix(in oklab, var(--color-brand) ${SHADES[SHADES.length - 1]}%, transparent)`,
      rest,
    });
  }
  return slices;
}

/** Uma lista com rolagem de condomínios (nome, valor e %) num popover: o que não cabe na rosca ou no ranking. Escolher um filtra. */
function MoreList({
  entries,
  selected,
  onSelect,
  label,
  className,
  children,
}: {
  entries: Entry[];
  selected: string;
  onSelect: (condominiumId: string) => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger aria-label={label} className={className}>
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Popover.Popup
            aria-label={label}
            className="max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-card bg-surface p-2 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          >
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-pressed={selected === entry.id}
                    onClick={() => {
                      onSelect(entry.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-9 w-full items-center gap-3 rounded-control px-3 text-left text-body outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5",
                      selected === entry.id && "bg-surface-muted"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                    <span className="shrink-0 tabular-nums text-ink-soft">{brl(String(entry.value))}</span>
                    <span className="w-9 shrink-0 text-right tabular-nums text-caption text-ink-faint">{entry.percent}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const rowClass =
  "flex w-full items-center gap-2 rounded-control px-2 py-1 text-left text-body outline-none transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted";

/**
 * Client Component: a participação de cada condomínio no total vencido. Até `DONUT_MAX` condomínios, uma rosca com a legenda ao lado (os 5 maiores
 * e "Outros", que abre a lista do que ele junta); acima disso, o ranking dos 5 maiores com uma barra fina e "Ver todos", que abre a lista com
 * rolagem. Altura fixa em qualquer caso; escolher um condomínio (`onSelect`) filtra o relatório.
 */
export function DelinquencyShareChart({
  lines,
  total,
  selected,
  onSelect,
}: {
  lines: DelinquencyShareLine[];
  total: number;
  selected: string;
  onSelect: (condominiumId: string) => void;
}) {
  const entries = toEntries(lines, total);
  const pick = (id: string) => onSelect(selected === id ? "" : id);

  if (entries.length > DONUT_MAX) {
    const top = entries.slice(0, TOP);
    const largest = top[0]?.value ?? 0;
    return (
      <div className="w-full sm:w-96">
        <ul>
          {top.map((entry) => (
            <li key={entry.id}>
              <button type="button" aria-pressed={selected === entry.id} onClick={() => pick(entry.id)} className={cn(rowClass, "gap-4", selected === entry.id && "bg-surface-muted")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{entry.name}</span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${largest > 0 ? Math.max((entry.value / largest) * 100, 2) : 0}%` }} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block tabular-nums">{brl(String(entry.value))}</span>
                  <span className="block tabular-nums text-caption text-ink-faint">{entry.percent}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <MoreList
          entries={entries}
          selected={selected}
          onSelect={onSelect}
          label={`Ver todos os ${entries.length} condomínios`}
          className="mt-1 rounded-control px-2 py-1.5 text-caption text-ink-soft outline-none transition-colors hover:text-ink focus-visible:text-ink"
        >
          Ver todos ({entries.length})
        </MoreList>
      </div>
    );
  }

  const slices = buildSlices(entries, total);
  const dot = (slice: Slice) => <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />;

  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={config} className="aspect-square size-36 shrink-0">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                nameKey="name"
                formatter={(value, _name, item) => (
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="text-ink-soft">{item?.payload?.name}</span>
                    <span className="font-medium tabular-nums">{brl(String(value))}</span>
                  </span>
                )}
              />
            }
          />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={slices.length > 1 ? 3 : 0}
            cornerRadius={4}
            strokeWidth={0}
            onClick={(_, index) => slices[index].id !== OTHERS && pick(slices[index].id)}
          >
            {slices.map((slice) => (
              <Cell key={slice.id} fill={slice.color} className={cn(slice.id !== OTHERS && "cursor-pointer")} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="min-w-0 max-w-64 flex-1">
        {slices.map((slice) => (
          <li key={slice.id}>
            {slice.rest ? (
              <MoreList entries={slice.rest} selected={selected} onSelect={onSelect} label={`Ver os ${slice.rest.length} condomínios de Outros`} className={rowClass}>
                {dot(slice)}
                <span className="truncate">{slice.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-caption text-ink-faint">{slice.percent}</span>
              </MoreList>
            ) : (
              <button type="button" aria-pressed={selected === slice.id} onClick={() => pick(slice.id)} className={cn(rowClass, selected === slice.id && "bg-surface-muted")}>
                {dot(slice)}
                <span className="truncate">{slice.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-caption text-ink-faint">{slice.percent}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
