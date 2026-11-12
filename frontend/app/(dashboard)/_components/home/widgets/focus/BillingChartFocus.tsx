"use client";

import { formatMonth } from "@/lib/format/format";

import { BillingSummaryChart } from "@/components/charts/BillingSummaryChart";
import { FOCUS_CHART_MONTHS, useBillingSummary } from "@/app/(dashboard)/_components/home/shared/use-billing-summary";
import { brl } from "../format";
import { LedgerRow, boletos, percent } from "./parts";

/**
 * Client Component: os boletos emitidos × recebidos dos últimos 12 meses em duas faixas baixas, separadas por uma linha fina. Em cima, o gráfico e, ao lado, a soma do
 * período (emitido, recebido e em aberto). Embaixo, mês a mês, do mais recente para o mais antigo, em duas colunas: emitido, recebido e a parte recebida.
 */
export function BillingChartFocus() {
  const { lines, isLoading } = useBillingSummary(FOCUS_CHART_MONTHS);
  if (lines.length === 0) return <p className="py-6 text-ink-soft">{isLoading ? "Carregando…" : "Não foi possível carregar os boletos."}</p>;

  const issued = lines.reduce((sum, line) => sum + Number(line.issued_total), 0);
  const paid = lines.reduce((sum, line) => sum + Number(line.paid_total), 0);
  const open = lines.reduce((sum, line) => sum + Number(line.open_total), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-[3fr_2fr]">
        <section>
          <h3 className="text-heading">Emitidos × recebidos</h3>
          <BillingSummaryChart lines={lines} className="mt-3 h-56 w-full" />
        </section>

        <section className="md:border-l md:border-border/50 md:pl-10">
          <h3 className="text-heading">Últimos {lines.length} meses</h3>
          <dl className="mt-3">
            <LedgerRow label="Emitido" detail={boletos(lines.reduce((sum, line) => sum + line.issued_count, 0))} value={brl(issued)} />
            <LedgerRow label="Recebido" detail={`${percent(paid, issued)}%`} value={brl(paid)} />
            <LedgerRow label="Em aberto" detail={boletos(lines.reduce((sum, line) => sum + line.open_count, 0))} value={brl(open)} />
          </dl>
        </section>
      </div>

      <section className="border-t border-border/50 pt-8">
        <div className="flex items-baseline justify-between gap-3 px-3">
          <h3 className="text-heading">Mês a mês</h3>
          <span className="text-caption text-ink-soft">emitido · recebido · % recebido</span>
        </div>
        <div className="mt-3 md:columns-2 md:gap-x-10">
          {[...lines].reverse().map((line) => (
            <div
              key={line.reference_month}
              title={`Em aberto: ${brl(line.open_total)}`}
              className="grid break-inside-avoid grid-cols-[3.5rem_1fr_1fr_2.5rem] items-baseline gap-x-3 rounded-button px-3 py-2 tabular-nums hover:bg-surface-muted"
            >
              <span>{formatMonth(line.reference_month)}</span>
              <span className="text-right text-ink-soft">{brl(line.issued_total)}</span>
              <span className="text-right">{brl(line.paid_total)}</span>
              <span className="text-right text-caption text-ink-faint">{percent(Number(line.paid_total), Number(line.issued_total))}%</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
