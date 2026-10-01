import Link from "next/link";

import { SeeAllLink } from "@/components/SeeAllLink";
import { Card } from "@/components/ui/card";

export interface RecentItem {
  id: number;
  name: string;
  sub?: string | null;
  meta?: string | null;
  /** Terceira coluna (texto ou elemento). */
  extra?: React.ReactNode;
  href: string;
}

/** Server Component: listagem compacta com link para a tela completa. */
export function RecentList({
  title,
  count,
  allHref,
  metaLabel,
  extraLabel,
  emptyText = "Nada cadastrado ainda.",
  items,
}: {
  title: string;
  count?: number;
  allHref: string;
  metaLabel: string;
  extraLabel: string;
  emptyText?: string;
  items: RecentItem[];
}) {
  return (
    <Card className="gap-3 self-start">
      <div className="flex items-baseline justify-between px-5">
        <h2 className="text-heading">
          {title}
          {count !== undefined && (
            <span className="ml-2 font-normal text-ink-faint tabular-nums">{count}</span>
          )}
        </h2>
        <SeeAllLink href={allHref} />
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-ink-soft">{emptyText}</p>
      ) : (
        <div className="px-2">
          <div className="grid grid-cols-[minmax(0,1fr)_9rem_8rem] gap-3 border-b border-border px-3 pb-1.5 text-caption text-ink-faint">
            <span>Nome</span>
            <span>{metaLabel}</span>
            <span>{extraLabel}</span>
          </div>
          <ul className="mt-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="grid grid-cols-[minmax(0,1fr)_9rem_8rem] items-center gap-3 rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-muted/60"
                >
                  <span className="truncate font-medium" title={item.name}>
                    {item.name}
                  </span>
                  <span className="truncate text-ink-soft" title={item.meta ?? undefined}>
                    {item.meta || "—"}
                  </span>
                  <span className="truncate">{item.extra}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
