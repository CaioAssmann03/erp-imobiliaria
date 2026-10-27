"use client";

import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FormField } from "@/components/form/FormField";
import { cn } from "@/lib/utils";

interface SegmentedFieldProps {
  name: string;
  label: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
}

/** Poucas opções lado a lado (Individual · Coletivo · Fração); grava o valor escolhido no formulário. */
export function SegmentedField({ name, label, hint, options }: SegmentedFieldProps) {
  const { setValue } = useFormContext();
  const current = useWatch({ name }) as string;
  const id = useId();

  return (
    <FormField id={id} label={label} hint={hint}>
      <div id={id} role="radiogroup" aria-label={label} className="flex gap-1 rounded-control bg-surface-muted p-1">
        {options.map((option) => {
          const selected = current === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setValue(name, option.value, { shouldDirty: true, shouldValidate: true })}
              className={cn(
                "h-8 flex-1 rounded-control px-3 text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60",
                selected ? "bg-card font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
