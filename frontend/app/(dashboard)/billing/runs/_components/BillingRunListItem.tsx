import Link from "next/link";

import type { BillingRun } from "@/lib/api/generated/models";
import { issuedNothing, runStatusLabel } from "@/lib/billing/billing-documents";
import { billingRunUrl, type BillingRunsScope } from "@/lib/billing/billing-run-workspace";
import { formatMonth } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/** A situação em texto simples, sem selo: só o que pede atenção ganha cor (falha em vermelho, concluída sem emitir nada em aviso, concluída em verde). */
const statusClass = (run: BillingRun): string =>
  run.status === "failed"
    ? "text-danger"
    : run.status === "succeeded"
      ? issuedNothing(run)
        ? "text-warning"
        : "text-success"
      : "text-ink-soft";

/** As contagens que importam numa linha: emitidos sempre; pulados e falhas só quando houve. */
const summary = (run: BillingRun): string =>
  [
    `${run.issued_count} ${run.issued_count === 1 ? "emitido" : "emitidos"}`,
    run.skipped_count > 0 ? `${run.skipped_count} ${run.skipped_count === 1 ? "pulado" : "pulados"}` : null,
    run.failed_count > 0 ? `${run.failed_count} ${run.failed_count === 1 ? "falha" : "falhas"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

/**
 * Uma execução na lista no padrão da lista de condomínios: o mês de referência e a situação em cima, as contagens embaixo. `isOpen` marca a aberta e `dimmed` apaga as
 * outras quando há uma aberta (voltam ao passar o mouse ou focar).
 */
export function BillingRunListItem({
  run,
  scope,
  isOpen = false,
  dimmed = false,
}: {
  run: BillingRun;
  scope: BillingRunsScope;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  return (
    <li>
      <Link
        href={billingRunUrl(run.id, scope)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-body font-medium tabular-nums">{formatMonth(run.reference_month)}</span>
          <span className={cn("shrink-0 text-caption", statusClass(run))}>{runStatusLabel(run.status, run)}</span>
        </span>
        <span className="block truncate text-caption text-ink-soft">{summary(run)}</span>
      </Link>
    </li>
  );
}
