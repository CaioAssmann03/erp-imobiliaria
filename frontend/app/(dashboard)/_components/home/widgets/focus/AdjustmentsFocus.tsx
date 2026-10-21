import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Dashboard } from "@/lib/api/generated/models";

import { Late } from "../../Late";
import { formatDate, relativeDays } from "../../relative-days";
import { SimpleBarChart } from "../../SimpleBarChart";
import { longMonthLabel, shortMonthLabel } from "../format";
import { FocusSection, FocusStat } from "./parts";

/** Visão completa dos reajustes: os números, o gráfico dos próximos meses e a lista dos condomínios por data. */
export function AdjustmentsFocus({ dash }: { dash: Dashboard | undefined }) {
  const upcoming = dash?.upcoming_adjustments ?? [];
  const byMonth = dash?.adjustments_by_month ?? [];
  const planned = byMonth.filter((item) => item.month !== "overdue").reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <FocusStat
          label="Atrasados"
          value={dash?.pending.overdue_adjustments ?? "–"}
          tone={(dash?.pending.overdue_adjustments ?? 0) > 0 ? "danger" : "default"}
          hint="A data já passou"
        />
        <FocusStat label="Nos próximos 30 dias" value={dash?.pending.adjustments_next_30_days ?? "–"} />
        <FocusStat label="Previstos em 6 meses" value={dash ? planned : "–"} />
      </div>

      <FocusSection title="Por mês" action={{ href: "/condominiums?pending=upcoming_adjustment", label: "Ver condomínios" }}>
        <SimpleBarChart
          data={byMonth.map((item) => ({
            label: shortMonthLabel(item.month),
            tooltipLabel: longMonthLabel(item.month),
            value: item.total,
          }))}
          className="h-56 w-full"
          highlightFirst
        />
      </FocusSection>

      <FocusSection title="Próximos reajustes">
        {upcoming.length === 0 ? (
          <p className="text-ink-soft">Nenhum condomínio com reajuste configurado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Condomínio</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="hidden sm:table-cell">Índice</TableHead>
                <TableHead className="text-right">Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell>
                    <Link href={`/condominiums/${adjustment.id}`} className="font-medium hover:underline">
                      {adjustment.name}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDate(adjustment.date)}</TableCell>
                  <TableCell className="hidden text-ink-soft sm:table-cell">{adjustment.adjustment_index || "–"}</TableCell>
                  <TableCell className="text-right">
                    {adjustment.overdue ? <Late>{relativeDays(adjustment.date)}</Late> : relativeDays(adjustment.date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </FocusSection>
    </div>
  );
}
