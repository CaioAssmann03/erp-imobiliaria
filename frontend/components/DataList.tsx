import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Barra acima de uma listagem (fixa no topo ao rolar): busca à esquerda, contagem à direita. */
export function Toolbar({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-2 z-20 -mx-2 mb-2 flex items-center justify-between gap-4 rounded-full bg-shell/95 px-2 py-2 backdrop-blur-md">
      {children}
      {right && <span className="text-body text-ink-soft">{right}</span>}
    </div>
  );
}

export function SearchField(props: React.ComponentProps<"input">) {
  return (
    <input
      type="search"
      className="h-9 w-full max-w-xs rounded-full bg-surface px-4 text-body shadow-card outline-none transition-shadow placeholder:text-ink-faint focus:ring-2 focus:ring-brand/50"
      {...props}
    />
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-caption font-semibold text-ink-soft">
      {initials || "?"}
    </span>
  );
}

export function NameCell({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <div className="flex max-w-[18rem] min-w-0 items-center gap-3">
      <Avatar name={name} />
      {/* Altura mínima de duas linhas: linhas sem `sub` não ficam menores que as outras. */}
      <div className="flex min-h-9 min-w-0 flex-col justify-center">
        <div className="truncate font-medium" title={name}>
          {name}
        </div>
        {sub && (
          <div className="truncate text-caption text-ink-soft" title={sub}>
            {sub}
          </div>
        )}
      </div>
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
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-48" />
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
