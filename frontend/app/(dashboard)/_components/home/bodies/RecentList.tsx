import Link from "next/link";

import { SeeAllLink } from "@/app/(dashboard)/_components/home/shared/SeeAllLink";
import { Card } from "@/components/ui/card";

export interface RecentItem {
  id: string;
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
  emptyText = "Nada cadastrado ainda.",
  items,
}: {
  title: string;
  count?: number;
  allHref: string;
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
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3 rounded-panel px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_9rem_8rem] transition-colors hover:bg-surface-muted/60"
                >
                  <span className="truncate font-medium" title={item.name}>
                    {item.name}
                  </span>
                  <span className="hidden truncate text-ink-soft md:block" title={item.meta ?? undefined}>
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
