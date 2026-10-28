import Link from "next/link";

import { cn } from "@/lib/utils";

const VARIANTS = {
  /** Ação principal sobre fundo claro. */
  primary: "bg-ink text-ink-foreground hover:bg-ink/85",
  /** Ação secundária sobre fundo claro. */
  outline: "border border-ink/20 text-ink hover:bg-ink/5",
  /** Ação principal sobre a faixa preta. */
  inverse: "bg-surface text-ink hover:bg-surface/85",
  /** Ação secundária sobre a faixa preta. */
  "inverse-outline": "border border-ink-foreground/25 text-ink-foreground hover:bg-ink-foreground/10",
} as const;

type MarketingButtonProps = React.ComponentProps<typeof Link> & { variant?: keyof typeof VARIANTS };

/** Botão das páginas públicas: retangular, rótulo em mono caixa-alta (ver docs/norms/marketing.md). */
export function MarketingButton({ variant = "primary", className, ...props }: MarketingButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-sharp px-4 text-label whitespace-nowrap transition-colors",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
