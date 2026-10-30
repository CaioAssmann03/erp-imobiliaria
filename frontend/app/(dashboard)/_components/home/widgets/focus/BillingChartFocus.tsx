"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMonth } from "@/lib/format";

import { BillingSummaryChart } from "../../BillingSummaryChart";
import { useBillingSummary } from "../../use-billing-summary";
import { brl } from "../format";
import { FocusSection, percent } from "./parts";

/** Client Component: os últimos 12 meses emitidos × recebidos, no gráfico e numa tabela com o que ainda está em aberto. */
export function BillingChartFocus() {
  const { lines, isLoading } = useBillingSummary(12);
  if (lines.length === 0) return <p className="py-6 text-ink-soft">{isLoading ? "Carregando…" : "Não foi possível carregar os boletos."}</p>;

  return (
    <div className="space-y-6">
      <BillingSummaryChart lines={lines} className="h-72 w-full" />
      <FocusSection title="Mês a mês">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Emitido</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Em aberto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...lines].reverse().map((line) => (
              <TableRow key={line.reference_month}>
                <TableCell className="tabular-nums">{formatMonth(line.reference_month)}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(line.issued_total)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {brl(line.paid_total)} <span className="text-ink-faint">{percent(Number(line.paid_total), Number(line.issued_total))}%</span>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{brl(line.open_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FocusSection>
    </div>
  );
}
