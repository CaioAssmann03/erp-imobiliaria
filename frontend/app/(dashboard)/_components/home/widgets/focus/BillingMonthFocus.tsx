"use client";

import { useState } from "react";

import { BillingMonthBodyRuns } from "./BillingMonthRuns";
import { useBillingSummary } from "@/app/(dashboard)/_components/home/shared/use-billing-summary";
import { useIssuanceCoverage } from "@/app/(dashboard)/_components/home/bodies/BillingMonthBody";
import { brl, integer, longMonthLabel } from "../format";
import { FocusList, FocusPager, FocusRow, LedgerRow, SegmentedBar, boletos, percent } from "./parts";

/**
 * Client Component: a emissão do mês corrente. À esquerda, o quadro do mês (emitido, recebido e em aberto, com a quantidade de boletos de cada um) sob uma barra
 * do quanto já foi recebido, os condomínios com boleto e o mês anterior para comparar; à direita, o que ainda pede ação (condomínios sem boleto, execuções com problema), que só aparece quando existe.
 */
export function BillingMonthFocus() {
  const { lines, current, isLoading } = useBillingSummary(2);
  const [missingPage, setMissingPage] = useState(1);
  const coverage = useIssuanceCoverage(missingPage);
  if (!current) return <p className="py-6 text-ink-soft">{isLoading ? "Carregando a emissão…" : "Não foi possível carregar a emissão."}</p>;

  const issued = Number(current.issued_total);
  const paid = Number(current.paid_total);
  const rate = percent(paid, issued);
  const previous = lines.length > 1 && lines[0].issued_count > 0 ? lines[0] : undefined;

  return (
    <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
      <div>
        <section>
          <h3 className="text-heading first-letter:uppercase">{longMonthLabel(current.reference_month.slice(0, 7))}</h3>
          {current.issued_count === 0 ? (
            <p className="mt-3 text-ink-soft">Nenhum boleto emitido neste mês ainda.</p>
          ) : (
            <>
              <div className="mt-4">
                <SegmentedBar label={`${rate}% recebido`} max={issued} segments={[{ value: paid, className: "bg-brand" }]} />
              </div>
              <p className="mt-2 text-caption text-ink-soft tabular-nums">{rate}% recebido</p>
              <dl className="mt-4">
                <LedgerRow label="Emitido" detail={boletos(current.issued_count)} value={brl(issued)} />
                <LedgerRow label="Recebido" detail={boletos(current.paid_count)} value={brl(paid)} />
                <LedgerRow label="Em aberto" detail={boletos(current.open_count)} value={brl(current.open_total)} />
              </dl>
              {coverage.ready && coverage.expected > 0 && (
                <dl className="mt-4 border-t border-border/50 pt-2">
                  <LedgerRow label="Condomínios com boleto" value={`${integer(coverage.issued)} de ${integer(coverage.expected)}`} />
                </dl>
              )}
            </>
          )}
        </section>

        {previous && (
          <section className="mt-8 border-t border-border/50 pt-8">
            <h3 className="text-heading first-letter:uppercase">{longMonthLabel(previous.reference_month.slice(0, 7))}</h3>
            <dl className="mt-3">
              <LedgerRow muted label="Emitido" detail={boletos(previous.issued_count)} value={brl(previous.issued_total)} />
              <LedgerRow muted label="Recebido" detail={`${percent(Number(previous.paid_total), Number(previous.issued_total))}%`} value={brl(previous.paid_total)} />
            </dl>
          </section>
        )}
      </div>

      <div className="divide-y divide-border/50 md:border-l md:border-border/50 md:pl-10 [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
        {coverage.ready && coverage.missingCount > 0 && (
          <FocusList title="Sem boleto neste mês" action={{ href: "/billing/runs", label: "Emitir" }}>
            {coverage.missing.map((condominium) => (
              <FocusRow key={condominium.id} href={`/condominiums/${condominium.id}`}>
                {condominium.name}
              </FocusRow>
            ))}
            <FocusPager page={missingPage} count={coverage.missingCount} noun="condomínios" onPage={setMissingPage} />
          </FocusList>
        )}
        <BillingMonthBodyRuns />
      </div>
    </div>
  );
}
