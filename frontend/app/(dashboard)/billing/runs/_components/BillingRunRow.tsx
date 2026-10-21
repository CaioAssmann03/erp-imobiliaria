"use client";

import { RowLink } from "@/components/data-list";
import { TableCell, TableRow } from "@/components/ui/table";
import type { BillingRun } from "@/lib/api/generated/models";
import { runStatusLabel } from "@/lib/billing-documents";
import { formatDateTime, formatMonth } from "@/lib/format";

import { BillingRunStatusBadge } from "./BillingRunStatusBadge";

/** Uma linha da lista de execuções: abre a execução (contagens e problemas). */
export function BillingRunRow({ run }: { run: BillingRun }) {
  const mobileSub = `${formatMonth(run.reference_month)} · ${runStatusLabel(run.status, run)} · ${run.issued_count} emitidos`;

  return (
    <TableRow>
      <TableCell>
        <RowLink href={`/billing/runs/${run.id}`} sub={mobileSub}>
          {run.condominium_name}
        </RowLink>
      </TableCell>
      <TableCell className="hidden tabular-nums md:table-cell">{formatMonth(run.reference_month)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <BillingRunStatusBadge status={run.status} counts={run} />
      </TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.issued_count}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.already_issued_count}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.skipped_count}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.failed_count}</TableCell>
      <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">{formatDateTime(run.started_at)}</TableCell>
    </TableRow>
  );
}
