"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { isoDate, monthLayout, shiftMonth } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const stepClass =
  "flex size-9 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5";

/**
 * O seletor de um dia, da mesma família do `MonthSelect`: um botão com a data (ou o `placeholder`) que abre um calendário do mês, com as setas para
 * mudar de mês e os dias numa grade de semanas (domingo primeiro); escolher um dia fecha. O botão de baixo (`allLabel`) limpa a data. O valor é o dia
 * em ISO ("2026-10-28") ou vazio; `today` é o dia de hoje em ISO, marcado na grade e onde o calendário abre quando não há data.
 */
export function DateSelect({
  label,
  value,
  onChange,
  today,
  placeholder = "Escolher data",
  allLabel = "Todas as datas",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  today: string;
  placeholder?: string;
  allLabel?: string;
  /** Classes do botão (a largura que ele ocupa onde está). */
  className?: string;
}) {
  const start = value || today;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) });

  const { offset, days } = monthLayout(view.year, view.month);
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // O calendário abre no mês da data escolhida (ou no de hoje).
        setView({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) });
      }}
    >
      <Popover.Trigger
        aria-label={`${label}: ${value ? formatDate(value) : placeholder}`}
        className={cn(
          "flex h-full min-w-0 items-center gap-2 rounded-control text-left text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
          value ? "text-ink" : "text-ink-faint",
          className
        )}
      >
        <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-soft" />
        <span className="min-w-0 truncate tabular-nums">{value ? formatDate(value) : placeholder}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Popover.Popup
            aria-label={label}
            className="w-[17.5rem] rounded-card bg-surface p-2 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          >
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Mês anterior" onClick={() => setView(shiftMonth(view.year, view.month, -1))} className={stepClass}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <span className="text-body font-medium">
                {MONTH_NAMES[view.month - 1]} <span className="tabular-nums">{view.year}</span>
              </span>
              <button type="button" aria-label="Próximo mês" onClick={() => setView(shiftMonth(view.year, view.month, 1))} className={stepClass}>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>

            <div className="mt-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((weekday, index) => (
                <span key={index} aria-hidden className="flex h-8 items-center justify-center text-caption text-ink-faint">
                  {weekday}
                </span>
              ))}
              {Array.from({ length: offset }, (_, index) => (
                <span key={`blank-${index}`} aria-hidden />
              ))}
              {Array.from({ length: days }, (_, index) => {
                const iso = isoDate(view.year, view.month, index + 1);
                const selected = iso === value;
                return (
                  <button
                    key={iso}
                    type="button"
                    aria-pressed={selected}
                    aria-label={formatDate(iso)}
                    onClick={() => choose(iso)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-control text-body tabular-nums outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5",
                      selected ? "bg-surface-muted font-medium text-ink" : iso === today ? "font-medium text-ink" : "text-ink-soft"
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-pressed={!value}
              onClick={() => choose("")}
              className={cn(
                "mt-1 h-9 w-full rounded-control px-3 text-left text-body outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5",
                !value ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
              )}
            >
              {allLabel}
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
