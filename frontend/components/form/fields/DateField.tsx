"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useId, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DateCalendar } from "@/components/dates/DateCalendar";
import { formatDate, todayIso } from "@/lib/format/format";
import { inputClass } from "@/lib/theme/ui";
import { isValidIsoDate } from "@/lib/format/validators";
import { cn } from "@/lib/utils";

import { FormField } from "../FormField";
import type { BaseProps } from "./types";
import { useFieldError } from "./use-field-error";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Só dígitos, no formato "dd/mm/aaaa" enquanto se digita. */
const maskDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
};

/** "28/10/2026" → "2026-10-28" (só se for uma data que existe). */
const toIso = (text: string): string | undefined => {
  if (text.length !== 10) return undefined;
  const iso = `${text.slice(6)}-${text.slice(3, 5)}-${text.slice(0, 2)}`;
  return isValidIsoDate(iso) ? iso : undefined;
};

/**
 * O campo de uma data de formulário: **dá para digitar** `dd/mm/aaaa` no próprio campo (com a máscara) e o ícone abre o calendário do resto do site
 * (`DateCalendar`: dias, meses e anos), no lugar do `<input type="date">` do navegador. O valor do formulário é o dia em ISO ("2026-10-28"), o mesmo do
 * `TextField type="date"`; enquanto o texto está incompleto ou não é uma data, o formulário guarda o que foi digitado e a validação do schema recusa
 * ("Data inválida"). Num campo opcional, apagar o texto esvazia a data.
 */
export function DateField({ name, label, required, hint, className }: BaseProps) {
  const { setValue, trigger } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  const value = (useWatch({ name }) as string | null | undefined) ?? "";
  const [open, setOpen] = useState(false);
  // O que a pessoa está digitando. Vale enquanto o formulário guarda o mesmo (a data em ISO, ou o texto incompleto); se o valor mudou por fora (o calendário,
  // um reset), o campo mostra o valor do formulário.
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed !== null && (toIso(typed) ?? typed) === value ? typed : ISO.test(value) ? formatDate(value) : value;

  const write = (next: string) => setValue(name, next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

  return (
    <FormField id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="relative">
          <input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${id}-message` : undefined}
            aria-required={required}
            onChange={(event) => {
              const next = maskDate(event.target.value);
              setTyped(next);
              const iso = toIso(next);
              // Data completa e válida: o dia em ISO; apagado: vazio; o resto: o texto, que a validação recusa.
              if (iso !== undefined) write(iso);
              else setValue(name, next, { shouldDirty: true, shouldTouch: true });
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
                value={toIso(text) ?? (ISO.test(value) ? value : "")}
                today={todayIso()}
                allLabel={required ? "" : "Limpar data"}
                onChange={(next) => {
                  write(next);
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
