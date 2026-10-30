"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useId, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DateCalendar } from "@/components/DateCalendar";
import { maskMonthYear, monthToApi } from "@/lib/billing-plan-payload";
import { todayIso } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

interface MonthFieldProps extends BaseProps {
  /** Como o formulário guarda o mês: `"typed"` ("03/2026", o padrão do faturamento) ou `"iso"` ("2026-03", o da competência). O campo sempre mostra "03/2026". */
  valueFormat?: "typed" | "iso";
}

const toDisplay = (value: string, format: "typed" | "iso") => {
  if (format === "typed") return value;
  const iso = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return iso ? `${iso[2]}/${iso[1]}` : value;
};

const fromDisplay = (text: string, format: "typed" | "iso") => {
  const first = monthToApi(text);
  if (first === undefined) return text;
  return format === "typed" ? text : first.slice(0, 7);
};

/**
 * O campo de um mês de formulário (competência, mês inicial, referência): **dá para digitar** `mm/aaaa` (com a máscara) e o ícone abre o calendário do resto do
 * site (`DateCalendar` no modo de mês: os meses do ano e, no ano do alto, a grade de anos), no lugar do `<input type="month">` e do texto solto. Enquanto o texto
 * está incompleto o formulário guarda o que foi digitado e a validação do schema o recusa. Meses futuros valem (um plano começa daqui a pouco).
 */
export function MonthField({ name, label, required, hint, className, valueFormat = "typed" }: MonthFieldProps) {
  const { setValue, trigger } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const value = (useWatch({ name }) as string | null | undefined) ?? "";
  const [open, setOpen] = useState(false);
  // O que a pessoa está digitando: vale enquanto o formulário guarda o mesmo; se o valor mudou por fora (o calendário, um reset), o campo mostra o do formulário.
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed !== null && fromDisplay(typed, valueFormat) === value ? typed : toDisplay(value, valueFormat);
  const calendarValue = monthToApi(text) ?? "";

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="relative">
          <input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            placeholder="mm/aaaa"
            maxLength={7}
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${id}-message` : undefined}
            aria-required={required}
            onChange={(event) => {
              const next = maskMonthYear(event.target.value);
              setTyped(next);
              setValue(name, fromDisplay(next, valueFormat), { shouldDirty: true, shouldTouch: true, shouldValidate: monthToApi(next) !== undefined });
            }}
            onBlur={() => void trigger(name)}
            className={cn(inputClass, "pr-10 tabular-nums")}
          />
          <Popover.Trigger
            aria-label={`Abrir o calendário: ${label}`}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-control text-ink-soft outline-none transition-colors hover:text-ink focus-visible:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <CalendarDays aria-hidden className="size-4" />
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Popover.Popup
              aria-label={label}
              className="w-[17.5rem] rounded-card bg-surface p-2 shadow-float outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
            >
              <DateCalendar
                pick="month"
                value={calendarValue}
                today={todayIso()}
                allLabel={required ? "" : "Limpar mês"}
                onChange={(next) => {
                  const month = next === "" ? "" : fromDisplay(`${next.slice(5, 7)}/${next.slice(0, 4)}`, valueFormat);
                  setValue(name, month, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                  setOpen(false);
                }}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </FormField>
  );
}
