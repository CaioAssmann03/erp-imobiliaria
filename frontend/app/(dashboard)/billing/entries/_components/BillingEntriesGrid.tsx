"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BillingEntry } from "@/lib/api/generated/models";
import { buildGrid } from "@/lib/billing-entry-payload";
import type { BillingEntriesScope } from "@/lib/billing-entry-workspace";
import { brl } from "@/lib/format";

import { EntryColumnHeader } from "./EntryColumnHeader";

/** A grade do mês: uma linha por unidade, uma coluna por lançamento e o total de cada boleto. */
export function BillingEntriesGrid({ entries, scope }: { entries: BillingEntry[]; scope: BillingEntriesScope }) {
  const grid = buildGrid(entries.map((entry) => ({ id: entry.id, month: entry.month })));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 bg-card align-top">Unidade</TableHead>
            {entries.map((entry) => (
              <TableHead key={entry.id} className="align-top">
                <EntryColumnHeader entry={entry} total={grid.entryTotals[entry.id] ?? "0.00"} scope={scope} />
              </TableHead>
            ))}
            <TableHead className="text-right align-top">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grid.rows.map((row) => (
            <TableRow key={row.unit}>
              <TableCell className="sticky left-0 bg-card font-medium">{row.unit_name}</TableCell>
              {entries.map((entry) => (
                <TableCell key={entry.id} className="tabular-nums">
                  {row.amounts[entry.id] === undefined ? "" : brl(row.amounts[entry.id])}
                </TableCell>
              ))}
              <TableCell className="text-right font-medium tabular-nums">{brl(row.total)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="hover:bg-transparent">
            <TableCell className="sticky left-0 bg-card font-medium">Total geral</TableCell>
            {entries.map((entry) => (
              <TableCell key={entry.id} className="font-medium tabular-nums">
                {brl(grid.entryTotals[entry.id] ?? "0")}
              </TableCell>
            ))}
            <TableCell className="text-right font-semibold tabular-nums">{brl(grid.grandTotal)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
