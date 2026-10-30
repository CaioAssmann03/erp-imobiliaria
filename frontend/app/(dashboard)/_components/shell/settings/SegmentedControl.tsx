import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Estilo do texto da opção (ex.: a fonte que ela representa). */
  style?: React.CSSProperties;
  className?: string;
}

/** Escolha de uma opção entre poucas, numa faixa só: a escolhida fica em relevo, as outras apagadas. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full gap-0.5 rounded-control bg-surface-muted p-0.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            style={option.style}
            className={cn(
              "h-8 min-w-0 truncate rounded-[0.5rem] px-3.5 text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60",
              selected ? "bg-surface font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink",
              option.className
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
