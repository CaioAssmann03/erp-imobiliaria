"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { formatMonth } from "@/lib/format/format";
import { monthIso } from "@/lib/reports/reports";
import { cn } from "@/lib/utils";

/** Quantos anos para trás o calendário alcança, além do ano atual. */
const YEARS_BACK = 5;
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const stepClass =
  "flex size-9 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent";

/**
 * O seletor de mês dos relatórios, da mesma família do `ScopeSelect` (metade de uma pílula). Ao clicar abre direto um calendário de meses: o ano
 * com setas e os 12 meses (os futuros ficam apagados); escolher um fecha. "Todos os meses" (`allLabel`, opcional) é o botão embaixo e limpa o mês. O valor é
 * o primeiro dia do mês em ISO ("2026-03-01") ou vazio para todos; `today` é o dia de hoje em ISO.
 */
export function MonthSelect({
  label,
  value,
  onChange,
  today,
  allLabel,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  today: string;
  /** O botão que limpa o mês ("Todos os meses"); sem ele o mês é obrigatório. */
  allLabel?: string;
  /** Classes do botão (a largura que ele ocupa na pílula). */
  className?: string;
}) {
  const latestYear = Number(today.slice(0, 4));
  const latest = monthIso(latestYear, Number(today.slice(5, 7)));
  const firstYear = latestYear - YEARS_BACK;

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(latestYear);

  const current = value ? formatMonth(value) : (allLabel ?? "Selecione");
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // O calendário abre no ano do mês escolhido (ou no atual).
        setYear(value ? Number(value.slice(0, 4)) : latestYear);
      }}
    >
      <Popover.Trigger
        aria-label={`${label}: ${current}`}
        className={cn(
          "flex h-full min-w-0 items-center justify-between gap-3 rounded-control px-4 text-left text-body outline-none transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand/50 data-[popup-open]:bg-ink/5",
          !value && "text-ink-soft",
          className
        )}
      >
        <span className="min-w-0 truncate">{current}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-faint" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Popover.Popup
            aria-label={label}
            style={{ width: "var(--anchor-width, 15rem)" }}
            className="min-w-60 rounded-card bg-surface p-2 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          >
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Ano anterior" disabled={year <= firstYear} onClick={() => setYear(year - 1)} className={stepClass}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <span className="text-body font-medium tabular-nums">{year}</span>
              <button type="button" aria-label="Próximo ano" disabled={year >= latestYear} onClick={() => setYear(year + 1)} className={stepClass}>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>

            <div className="mt-1 grid grid-cols-3 gap-1">
              {MONTH_NAMES.map((name, index) => {
                const iso = monthIso(year, index + 1);
                const selected = iso === value;
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={iso > latest}
                    aria-pressed={selected}
                    onClick={() => choose(iso)}
                    className={cn(
                      "h-9 rounded-control text-body outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5 disabled:pointer-events-none disabled:opacity-30",
                      selected ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {allLabel && (
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
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
