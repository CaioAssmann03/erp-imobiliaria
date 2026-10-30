"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { DateCalendar } from "@/components/dates/DateCalendar";
import { formatDate } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/**
 * O seletor de um dia, da mesma família do `MonthSelect`: um botão com a data (ou o `placeholder`) que abre um calendário do mês, com as setas para
 * mudar de mês e os dias numa grade de semanas (domingo primeiro); escolher um dia fecha. O calendário em si é o `DateCalendar` (dias, meses e anos). O botão de baixo (`allLabel`, omitido se vazio) limpa a data. O valor é o dia
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
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
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
            <DateCalendar
              value={value}
              today={today}
              allLabel={allLabel}
              onChange={(next) => {
                onChange(next);
                setOpen(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
