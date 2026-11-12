import Link from "next/link";

import { cn } from "@/lib/utils";

type ErrorActionButtonProps = {
  primary?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/** Botão das telas de erro: retangular, rótulo em caixa-alta. Principal = ink cheio; secundário = só contorno. */
export function ErrorActionButton({ primary = false, disabled, children, href, onClick }: ErrorActionButtonProps) {
  const className = cn(
    "inline-flex h-10 items-center justify-center rounded-sharp px-5 text-label whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
    primary ? "bg-ink text-ink-foreground hover:bg-ink/85" : "border border-ink/25 text-ink hover:bg-ink/5",
  );

  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
