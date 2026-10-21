import Link from "next/link";

import type { Dashboard } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

import { pendingRows, SEVERITY_LABELS, type Severity } from "../pending-rows";
import { FocusStat } from "./parts";

const DOT: Record<Severity, string> = {
  critical: "bg-danger",
  attention: "bg-warning",
  info: "bg-ink-soft",
};

const ORDER: Severity[] = ["critical", "attention", "info"];

/** Visão completa das pendências: separadas por gravidade, cada uma com a explicação e o atalho para resolver. */
export function PendingFocus({ pending }: { pending: Dashboard["pending"] | undefined }) {
  const rows = pendingRows(pending);
  const withPending = rows.filter((row) => row.count > 0);
  const total = withPending.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <FocusStat label="Tipos com pendência" value={pending ? `${withPending.length} de ${rows.length}` : "–"} />
        <FocusStat label="Itens a resolver" value={pending ? total : "–"} tone={total > 0 ? "danger" : "success"} />
        <FocusStat
          label="Críticas"
          value={pending ? withPending.filter((row) => row.severity === "critical").length : "–"}
          hint="Impedem a cobrança"
        />
      </div>

      {pending && total === 0 && <p className="py-4 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>}

      {ORDER.map((severity) => {
        const group = rows.filter((row) => row.severity === severity);
        return (
          <section key={severity} className="space-y-2">
            <h3 className="flex items-center gap-2 text-heading">
              <span className={cn("size-2 rounded-full", DOT[severity])} />
              {SEVERITY_LABELS[severity]}
            </h3>
            <ul className="space-y-1.5">
              {group.map((row) => (
                <li key={row.label}>
                  <Link
                    href={row.href}
                    className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-panel bg-surface-muted px-4 py-3 transition-colors hover:bg-surface-sunken"
                  >
                    <span className={cn("text-title tabular-nums", row.count === 0 && "text-ink-faint")}>
                      {pending ? row.count : "–"}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block truncate font-medium", row.count === 0 && "text-ink-faint")}>
                        {row.label}
                      </span>
                      <span className="block text-caption text-ink-soft">{row.detail}</span>
                    </span>
                    <span className="text-body text-ink-soft">{row.count > 0 ? "Resolver →" : "Ver →"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
