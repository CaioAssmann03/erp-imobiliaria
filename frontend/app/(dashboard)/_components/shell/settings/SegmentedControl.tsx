import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Estilo do texto da opção (ex.: a fonte que ela representa). */
  style?: React.CSSProperties;
  className?: string;
}

/** Escolha de uma opção entre poucas, numa faixa só: a escolhida fica em relevo sobre o trilho, as outras apagadas. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  fullWidth = false,
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** Ocupa a largura toda, com as opções do mesmo tamanho (nas linhas com o controle embaixo). */
  fullWidth?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("gap-0.5 rounded-control bg-surface-sunken p-1", fullWidth ? "flex w-full" : "inline-flex max-w-full")}>
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
              "h-9 min-w-0 truncate rounded-button px-4 text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60",
              selected ? "bg-surface font-medium text-ink shadow-card" : "text-ink-soft hover:text-ink",
              fullWidth && "flex-1",
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
