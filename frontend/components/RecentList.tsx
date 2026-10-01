import Link from "next/link";

import { NameCell } from "@/components/DataList";
import { SeeAllLink } from "@/components/SeeAllLink";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";

export interface RecentItem {
  id: number;
  name: string;
  sub?: string | null;
  meta?: string | null;
  ativo?: boolean;
  href: string;
}

/** Server Component: listagem compacta com link para a tela completa. */
export function RecentList({
  title,
  count,
  allHref,
  metaLabel,
  items,
}: {
  title: string;
  count?: number;
  allHref: string;
  metaLabel: string;
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
        <p className="px-5 py-8 text-ink-soft">Nada cadastrado ainda.</p>
      ) : (
        <div className="px-2">
          <div className="grid grid-cols-[minmax(0,1fr)_8rem_6rem] gap-3 rounded-panel bg-surface-muted px-3 py-1.5 text-caption font-medium text-ink-soft">
            <span>Nome</span>
            <span>{metaLabel}</span>
            <span>Status</span>
          </div>
          <ul className="mt-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="grid grid-cols-[minmax(0,1fr)_8rem_6rem] items-center gap-3 rounded-panel px-3 py-1.5 transition-colors hover:bg-surface-muted"
                >
                  <NameCell name={item.name} sub={item.sub} />
                  <span className="truncate text-ink-soft" title={item.meta ?? undefined}>
                    {item.meta || "—"}
                  </span>
                  <span>
                    <StatusBadge ativo={item.ativo} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
