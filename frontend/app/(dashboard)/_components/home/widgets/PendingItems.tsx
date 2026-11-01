import Link from "next/link";

import type { Dashboard } from "@/lib/api/generated/models";

import { integer } from "./format";
import { pendingRows, type Severity } from "./pending-rows";

/**
 * O corpo do card de pendências: só as pendências que existem, cada uma numa linha (nome e número, no mesmo
 * desenho das listas dos outros cards, mas sem divisórias); a explicação fica na dica ao passar o mouse. No pé, como nos outros
 * cards, uma linha com o total por gravidade ("6 críticas · 2 para acompanhar"). A visão ampliada mostra também as pendências que o painel deixa para outros
 * cards e as que estão zeradas.
 */
export function PendingItems({
  pending,
  large,
}: {
  pending: Dashboard["pending"] | undefined;
  large: boolean;
}) {
  const all = pendingRows(pending);
  const total = all.filter((row) => large || !row.hiddenOnPanel).reduce((sum, row) => sum + row.count, 0);
  const rows = all.filter((row) => (large ? true : !row.hiddenOnPanel && (!pending || row.count > 0)));
  const bySeverity = (severity: Severity) => all.filter((row) => row.severity === severity && (large || !row.hiddenOnPanel)).reduce((sum, row) => sum + row.count, 0);
  const critical = bySeverity("critical");
  const attention = bySeverity("attention");
  const info = bySeverity("info");
  const summary = [
    critical > 0 && `${integer(critical)} ${critical === 1 ? "crítica" : "críticas"}`,
    attention > 0 && `${integer(attention)} em atenção`,
    info > 0 && `${integer(info)} para acompanhar`,
  ].filter(Boolean);

  if (pending && total === 0) {
    return <p className="py-6 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>;
  }

  return (
    <>
      <ul className="-mt-1">
        {rows.map((row) => (
          <li key={row.label}>
            <Link href={row.href} title={row.detail} className="flex items-baseline justify-between gap-3 py-2.5 transition-colors hover:text-ink">
              <span className={`min-w-0 truncate ${row.count > 0 ? "text-ink-soft" : "text-ink-faint"}`}>{row.label}</span>
              <span className={`shrink-0 tabular-nums ${row.count > 0 ? "" : "text-ink-faint"}`}>{pending ? row.count : "–"}</span>
            </Link>
          </li>
        ))}
      </ul>

      {pending && summary.length > 0 && <p className="mt-auto pt-3 text-caption text-ink-faint">{summary.join(" · ")}</p>}
    </>
  );
}
