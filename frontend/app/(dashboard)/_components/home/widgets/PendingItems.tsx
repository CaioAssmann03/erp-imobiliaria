import Link from "next/link";

import type { Dashboard } from "@/lib/api/generated/models";

import { pendingRows } from "./pending-rows";

export function PendingItems({
  pending,
  large,
}: {
  pending: Dashboard["pending"] | undefined;
  large: boolean;
}) {
  const rows = pendingRows(pending);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (pending && total === 0) {
    return <p className="py-6 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>;
  }

  return (
    <ul className="-mx-2 space-y-0.5">
      {rows.map((row) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className="flex items-center justify-between gap-3 rounded-panel px-3 py-2 transition-colors hover:bg-surface-muted"
          >
            <div className="min-w-0">
              <div className={`truncate ${row.count > 0 ? "font-medium" : "text-ink-faint"}`}>
                {row.label}
              </div>
              {large && <div className="text-caption text-ink-soft">{row.detail}</div>}
            </div>
            <span
              className={`text-heading tabular-nums ${row.count > 0 ? "text-ink" : "text-ink-faint"}`}
            >
              {pending ? row.count : "–"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

