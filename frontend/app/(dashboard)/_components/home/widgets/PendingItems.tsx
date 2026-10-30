import Link from "next/link";

import type { Dashboard } from "@/lib/api/generated/models";

import { pendingRows, type Severity } from "./pending-rows";

/** A cor do número de uma pendência: a crítica em vermelho, a que pede atenção em âmbar, as demais no texto; zero fica apagado. */
const COUNT_TONE: Record<Severity, string> = {
  critical: "text-danger",
  attention: "text-warning",
  info: "text-ink",
};

/**
 * O corpo do card de pendências: o total em tipo grande e, embaixo, cada pendência com o que ela significa numa
 * linha (nome e explicação) e o número na cor da gravidade. A visão ampliada mostra também as pendências que o painel deixa para outros cards.
 */
export function PendingItems({
  pending,
  large,
}: {
  pending: Dashboard["pending"] | undefined;
  large: boolean;
}) {
  const all = pendingRows(pending);
  const rows = large ? all : all.filter((row) => !row.hiddenOnPanel);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (pending && total === 0) {
    return <p className="py-6 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>;
  }

  return (
    <>
      <div className="text-title tabular-nums">{pending ? total : "–"}</div>

      <ul className="-mx-2 mt-3 space-y-0.5">
        {rows.map((row) => (
          <li key={row.label}>
            <Link
              href={row.href}
              className="flex items-center justify-between gap-3 rounded-panel px-3 py-2 transition-colors hover:bg-surface-muted"
            >
              <div className="min-w-0">
                <div className={`truncate ${row.count > 0 ? "font-medium" : "text-ink-faint"}`}>{row.label}</div>
                <div className="truncate text-caption text-ink-soft">{row.detail}</div>
              </div>
              <span className={`text-heading tabular-nums ${row.count > 0 ? COUNT_TONE[row.severity] : "text-ink-faint"}`}>
                {pending ? row.count : "–"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
