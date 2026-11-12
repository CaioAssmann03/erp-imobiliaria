"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { isoDate, monthLayout, shiftMonth } from "@/lib/format/calendar";
import { formatDate } from "@/lib/format/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MONTH_ABBREVIATIONS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
/** Quantos anos a grade de anos mostra de uma vez (4 linhas de 3). */
const YEARS_PER_PAGE = 12;

type Mode = "days" | "months" | "years";

const stepClass =
  "flex size-9 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5";

/**
 * O calendário de um dia, em três níveis: os dias do mês, os meses do ano (clicando no mês e ano do alto) e os anos (clicando no ano, 12 por página, para chegar
 * rápido a uma data distante). Sem moldura nem botão que o abra: quem o usa (`DateSelect`, `DateField`) o põe dentro de um popover. Abre nos dias do mês da data
 * escolhida (ou do de hoje, `today`, marcado na grade). `allLabel` (omitido se vazio) é o botão de baixo que limpa a data. O valor é o dia em ISO ("2026-10-28") ou vazio.
 */
export function DateCalendar({
  value,
  today,
  onChange,
  allLabel = "",
  pick = "day",
}: {
  value: string;
  today: string;
  onChange: (value: string) => void;
  allLabel?: string;
  /** `"month"`: para um mês só (competência): abre nos meses do ano e escolher um mês devolve o primeiro dia dele. */
  pick?: "day" | "month";
}) {
  const start = value || today;
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) });
  const [mode, setMode] = useState<Mode>(pick === "month" ? "months" : "days");
  const [yearsFrom, setYearsFrom] = useState(0);
  const { offset, days } = monthLayout(view.year, view.month);

  return (
    <>
        {mode === "days" && (
          <>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Mês anterior" onClick={() => setView(shiftMonth(view.year, view.month, -1))} className={stepClass}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Escolher mês e ano"
                onClick={() => setMode("months")}
                className="h-9 rounded-control px-3 text-body font-medium outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5"
              >
                {MONTH_NAMES[view.month - 1]} <span className="tabular-nums">{view.year}</span>
              </button>
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
                    onClick={() => onChange(iso)}
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
          </>
        )}

        {mode === "months" && (
          <>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Ano anterior" onClick={() => setView({ ...view, year: view.year - 1 })} className={stepClass}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Escolher o ano"
                onClick={() => {
                  setYearsFrom(Math.floor(view.year / YEARS_PER_PAGE) * YEARS_PER_PAGE);
                  setMode("years");
                }}
                className="h-9 rounded-control px-3 text-body font-medium tabular-nums outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5"
              >
                {view.year}
              </button>
              <button type="button" aria-label="Próximo ano" onClick={() => setView({ ...view, year: view.year + 1 })} className={stepClass}>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-0.5">
              {MONTH_ABBREVIATIONS.map((name, index) => {
                const isCurrent = view.year === Number(start.slice(0, 4)) && index + 1 === Number(start.slice(5, 7));
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={isCurrent}
                    onClick={() => {
                      if (pick === "month") {
                        onChange(isoDate(view.year, index + 1, 1));
                        return;
                      }
                      setView({ year: view.year, month: index + 1 });
                      setMode("days");
                    }}
                    className={cn(
                      "h-10 rounded-control text-body outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5",
                      isCurrent ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "years" && (
          <>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Anos anteriores" onClick={() => setYearsFrom(yearsFrom - YEARS_PER_PAGE)} className={stepClass}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <span className="text-body font-medium tabular-nums">
                {yearsFrom} – {yearsFrom + YEARS_PER_PAGE - 1}
              </span>
              <button type="button" aria-label="Próximos anos" onClick={() => setYearsFrom(yearsFrom + YEARS_PER_PAGE)} className={stepClass}>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-0.5">
              {Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
                const year = yearsFrom + index;
                const isCurrent = year === Number(start.slice(0, 4));
                return (
                  <button
                    key={year}
                    type="button"
                    aria-pressed={isCurrent}
                    onClick={() => {
                      setView({ year, month: view.month });
                      setMode("months");
                    }}
                    className={cn(
                      "h-10 rounded-control text-body tabular-nums outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5",
                      isCurrent ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {allLabel && (
          <button
            type="button"
            aria-pressed={!value}
            onClick={() => onChange("")}
            className={cn(
              "mt-1 h-9 w-full rounded-control px-3 text-left text-body outline-none transition-colors hover:bg-ink/5 focus-visible:bg-ink/5",
              !value ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
            )}
          >
            {allLabel}
          </button>
        )}
    </>
  );
}
