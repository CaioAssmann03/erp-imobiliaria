import type { Dashboard } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

import { integer } from "../format";
import { pendingRows, SEVERITY_LABELS, type Severity } from "../pending-rows";
import { FocusRow } from "./parts";

/** Uma coluna de cada vez: as críticas à esquerda, que bloqueiam a cobrança, e à direita o que pede atenção e o que é só para acompanhar. */
const COLUMNS: Severity[][] = [["critical"], ["attention", "info"]];

/**
 * Visão completa das pendências, sem barra nem legenda: só os blocos de cada gravidade com o seu total, e em cada um os tipos de pendência com a explicação
 * embaixo e o número à direita (em vermelho nas críticas). A linha inteira leva a quem resolve. Os tipos zerados aparecem apagados.
 */
export function PendingFocus({ pending }: { pending: Dashboard["pending"] | undefined }) {
  const rows = pendingRows(pending);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (pending && total === 0) return <p className="py-6 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>;

  return (
    <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
      {COLUMNS.map((severities, index) => (
        <div key={index} className={cn("space-y-8", index > 0 && "md:border-l md:border-border/50 md:pl-10")}>
          {severities.map((severity) => {
            const group = rows.filter((row) => row.severity === severity);
            const sum = group.reduce((acc, row) => acc + row.count, 0);
            return (
              <section key={severity}>
                <div className="flex items-baseline justify-between gap-3 px-3">
                  <h3 className="text-heading">{SEVERITY_LABELS[severity]}</h3>
                  <span className="shrink-0 text-caption tabular-nums text-ink-soft">{pending ? `${integer(sum)} ${sum === 1 ? "item" : "itens"}` : ""}</span>
                </div>
                <div className="mt-3">
                  {group.map((row) => (
                    <FocusRow
                      key={row.label}
                      href={row.href}
                      title={row.detail}
                      sub={row.detail}
                      detail={
                        <span className={cn("text-body", row.count === 0 ? "text-ink-faint" : severity === "critical" && "text-danger")}>
                          {pending ? integer(row.count) : "–"}
                        </span>
                      }
                    >
                      <span className={cn(row.count === 0 && "text-ink-faint")}>{row.label}</span>
                    </FocusRow>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ))}
    </div>
  );
}
