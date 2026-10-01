import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Barra acima de uma listagem (fixa no topo ao rolar): busca e filtros à esquerda, contagem à direita. */
export function Toolbar({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-2 z-20 -mx-2 mb-2 flex items-center justify-between gap-4 rounded-full bg-shell/95 px-2 py-2 backdrop-blur-md">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {right && <span className="shrink-0 text-body text-ink-soft">{right}</span>}
    </div>
  );
}

export function SearchField(props: React.ComponentProps<"input">) {
  return (
    <input
      type="search"
      className="h-9 w-72 max-w-full shrink-0 rounded-full bg-surface px-4 text-body shadow-card outline-none transition-shadow placeholder:text-ink-faint focus:ring-2 focus:ring-brand/50"
      {...props}
    />
  );
}

/** Nome da linha: link que cobre a linha inteira (clicar em qualquer ponto abre o registro). */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block max-w-[22rem] truncate font-medium after:absolute after:inset-0"
    >
      {children}
    </Link>
  );
}

/** Ações secundárias da linha: aparecem ao passar o mouse ou focar (sempre visíveis no toque). */
export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex items-center justify-end gap-1 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100">
      {children}
    </div>
  );
}

/** Card de listagem com estados de carregamento e vazio. */
export function ListState({
  isLoading,
  isEmpty,
  emptyTitle,
  emptyText,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 p-3">
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-3 py-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="px-5 py-14 text-center">
          <p className="text-heading">{emptyTitle}</p>
          {emptyText && <p className="mt-1 text-body text-ink-soft">{emptyText}</p>}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
