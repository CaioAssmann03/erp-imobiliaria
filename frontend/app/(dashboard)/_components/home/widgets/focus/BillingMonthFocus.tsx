"use client";

import Link from "next/link";

import { LinkButton } from "@/components/LinkButton";
import { formatMonth } from "@/lib/format";

import { BillingMonthBodyRuns } from "./BillingMonthRuns";
import { useBillingSummary } from "../../use-billing-summary";
import { firstDayOfThisMonth, useIssuanceCoverage } from "../../BillingMonthBody";
import { brl } from "../format";
import { FocusSection, FocusStat, ShareBar, percent } from "./parts";

/** Client Component: o mês corrente em reais e em quantidade, o quanto já foi recebido e as execuções com problema. */
export function BillingMonthFocus() {
  const { current, isLoading } = useBillingSummary(1);
  const coverage = useIssuanceCoverage();
  if (!current) return <p className="py-6 text-ink-soft">{isLoading ? "Carregando a emissão…" : "Não foi possível carregar a emissão."}</p>;

  const issued = Number(current.issued_total);
  const paid = Number(current.paid_total);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <FocusStat label="Emitido" value={brl(issued)} hint={`${current.issued_count} boletos`} />
        <FocusStat label="Recebido" value={brl(paid)} tone="success" hint={`${current.paid_count} boletos · ${percent(paid, issued)}%`} />
        <FocusStat label="Em aberto" value={brl(current.open_total)} hint={`${current.open_count} boletos`} />
      </div>

      <FocusSection title={`Recebido em ${formatMonth(firstDayOfThisMonth())}`}>
        <ShareBar label="Valor recebido" value={paid} max={issued} text={`${percent(paid, issued)}% de ${brl(issued)}`} />
        <ShareBar label="Boletos pagos" value={current.paid_count} max={current.issued_count} text={`${current.paid_count} de ${current.issued_count}`} />
      </FocusSection>

      {coverage.ready && coverage.missing.length > 0 && (
        <FocusSection title={`Condomínios sem boleto neste mês (${coverage.missing.length} de ${coverage.expected})`} action={{ href: "/billing/runs", label: "Emitir o mês" }}>
          <ul className="divide-y divide-border">
            {coverage.missing.map((condominium) => (
              <li key={condominium.id}>
                <Link href={`/condominiums/${condominium.id}`} className="flex items-baseline justify-between gap-3 py-2.5 hover:underline">
                  <span className="truncate">{condominium.name}</span>
                  <span className="shrink-0 text-caption tabular-nums text-ink-faint">{String(condominium.code).padStart(4, "0")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </FocusSection>
      )}

      <BillingMonthBodyRuns />

      <div className="flex flex-wrap gap-2">
        <LinkButton variant="secondary" href="/billing/documents">
          Boletos emitidos
        </LinkButton>
        <LinkButton variant="secondary" href="/billing/runs">
          Execuções
        </LinkButton>
        <Link href="/billing/entries" className="self-center text-body text-ink-soft hover:text-ink hover:underline">
          Inclusão de valores →
        </Link>
      </div>
    </div>
  );
}
