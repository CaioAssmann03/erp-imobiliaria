"use client";

import { cn } from "@/lib/utils";

/** Poucas opções lado a lado (Individual · Coletivo · Fração), sem formulário: quem usa guarda o valor (`SegmentedField` o liga a um campo). */
export function SegmentedControl({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div id={id} role="radiogroup" aria-label={label} className="flex gap-1 rounded-control bg-surface-muted p-1">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 flex-1 rounded-button px-3 text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60",
              selected ? "bg-card font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
