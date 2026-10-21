"use client";

import { RowLink } from "@/components/data-list";
import { TableCell, TableRow } from "@/components/ui/table";
import type { BillingRun } from "@/lib/api/generated/models";
import { runStatusLabel } from "@/lib/billing-documents";
import { formatMonth } from "@/lib/format";

import { BillingRunStatusBadge } from "./BillingRunStatusBadge";

const startedAt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Uma linha da lista de execuções: abre a execução (contagens e problemas). */
export function BillingRunRow({ run }: { run: BillingRun }) {
  const mobileSub = `${formatMonth(run.reference_month)} · ${runStatusLabel(run.status)} · ${run.issued_count} emitidos`;

  return (
    <TableRow>
      <TableCell>
        <RowLink href={`/billing/runs/${run.id}`} sub={mobileSub}>
          {run.condominium_name}
        </RowLink>
      </TableCell>
      <TableCell className="hidden tabular-nums md:table-cell">{formatMonth(run.reference_month)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <BillingRunStatusBadge status={run.status} />
      </TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.issued_count}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.already_issued_count}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.skipped_count}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{run.failed_count}</TableCell>
      <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">{startedAt(run.started_at)}</TableCell>
    </TableRow>
  );
}
