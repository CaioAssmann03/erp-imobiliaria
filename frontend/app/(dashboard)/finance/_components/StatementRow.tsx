"use client";

import { RowActions } from "@/components/data-list";
import { TableCell, TableRow } from "@/components/ui/table";
import type { CurrentAccountEntry } from "@/lib/api/generated/models";
import { brl, formatDate, formatMonth } from "@/lib/format";
import { BATCH_ORIGINS } from "@/lib/schemas/entry-batch";
import { cn } from "@/lib/utils";

import { ReverseEntryDialog } from "./ReverseEntryDialog";

export function StatementRow({ entry }: { entry: CurrentAccountEntry }) {
  const isReversal = entry.reversal_of !== null;
  const note = [entry.is_reversed ? "Estornado" : null, isReversal ? "Estorno" : null].filter(Boolean).join(" · ");
  const origin = BATCH_ORIGINS.find((item) => item.value === entry.batch_origin)?.label ?? entry.batch_origin;
  const batch = `${origin} ${formatDate(entry.batch_date)}`;

  return (
    <TableRow className={cn(entry.is_reversed && "text-ink-faint")}>
      <TableCell className="whitespace-nowrap tabular-nums">{formatDate(entry.entry_date)}</TableCell>
      <TableCell>
        <div className={cn("max-w-[13rem] truncate font-medium sm:max-w-[22rem]", entry.is_reversed && "line-through")}>
          {entry.description}
        </div>
        <div className="max-w-[13rem] truncate text-caption text-ink-soft md:hidden">
          {[`Nº ${entry.registry}`, entry.cost_center_name, entry.unit_name && `Unid. ${entry.unit_name}`, note]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </TableCell>
      <TableCell className="hidden text-ink-soft tabular-nums md:table-cell">{entry.registry}</TableCell>
      <TableCell className="hidden max-w-[12rem] truncate text-ink-soft md:table-cell">{entry.entry_template_name}</TableCell>
      <TableCell className="hidden max-w-[12rem] truncate text-ink-soft md:table-cell">{entry.cost_center_name}</TableCell>
      <TableCell className="hidden max-w-[8rem] truncate text-ink-soft md:table-cell">{entry.unit_name || "—"}</TableCell>
      <TableCell className="hidden text-ink-soft tabular-nums md:table-cell">{formatMonth(entry.competence_month)}</TableCell>
      <TableCell className="hidden whitespace-nowrap text-ink-soft md:table-cell">{batch}</TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        {entry.kind === "credit" ? "+ " : "− "}
        {brl(entry.amount)}
        {note && <div className="hidden text-caption text-ink-soft md:block">{note}</div>}
      </TableCell>
      <TableCell>
        <RowActions>{!entry.is_reversed && !isReversal && <ReverseEntryDialog entry={entry} />}</RowActions>
      </TableCell>
    </TableRow>
  );
}
