"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { DateCalendar } from "@/components/dates/DateCalendar";
import { maskDate, toIso } from "@/lib/format/date-text";
import { formatDate } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/**
 * O seletor de um dia, da mesma família do `MonthSelect`: **dá para digitar** `dd/mm/aaaa` no próprio campo (com a máscara) e o ícone abre um calendário do
 * mês, com as setas para mudar de mês e os dias numa grade de semanas (domingo primeiro); escolher um dia fecha. O calendário em si é o `DateCalendar`
 * (dias, meses e anos). O botão de baixo (`allLabel`, omitido se vazio) limpa a data. O valor é o dia em ISO ("2026-10-28") ou vazio: só uma data completa e
 * que existe vira valor; enquanto o texto está incompleto o valor fica vazio (sem filtro), e ao sair do campo ele volta a mostrar o valor. `today` é o dia de
 * hoje em ISO, marcado na grade e onde o calendário abre quando não há data. Não desenha anel de foco: a linha onde ele fica (`ScopeSearchRow`) já o desenha, e dois
 * anéis apareceriam juntos.
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
  /** Classes do campo (a largura que ele ocupa onde está). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // O que a pessoa está digitando: vale enquanto está incompleto ou é o dia do valor; se o valor mudou por fora (o calendário), o campo mostra o valor.
  const [typed, setTyped] = useState<string | null>(null);
  const typedIso = typed === null ? undefined : toIso(typed);
  const text = typed !== null && (typedIso === undefined || typedIso === value) ? typed : value ? formatDate(value) : "";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex h-full min-w-0 items-center gap-2 rounded-control text-body",
          value ? "text-ink" : "text-ink-faint",
          className
        )}
      >
        <Popover.Trigger
          aria-label={`Abrir o calendário: ${label}`}
          className="flex shrink-0 items-center rounded-control text-ink-soft outline-none transition-colors hover:text-ink focus-visible:text-ink"
        >
          <CalendarDays aria-hidden className="size-4" />
        </Popover.Trigger>
        <input
          aria-label={label}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          maxLength={10}
          value={text}
          onChange={(event) => {
            const next = maskDate(event.target.value);
            setTyped(next);
            const iso = toIso(next);
            if (iso !== undefined) onChange(iso);
            else if (value) onChange("");
          }}
          onBlur={() => setTyped(null)}
          className="min-w-0 flex-1 bg-transparent tabular-nums text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

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
                setTyped(null);
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
