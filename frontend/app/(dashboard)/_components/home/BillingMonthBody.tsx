"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useBillingRunsList, useCondominiumsList } from "@/lib/api/generated";

import { Late } from "./Late";
import { useBillingSummary } from "./use-billing-summary";
import { brl } from "./widgets/format";

export const firstDayOfThisMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
};

/** As execuções da emissão do mês corrente que terminaram com problema (condomínio sem boleto). */
export function useRunsWithProblem() {
  const { data, isLoading } = useBillingRunsList({ reference_month: firstDayOfThisMonth(), limit: 100 });
  const runs = (data?.results ?? []).filter((run) => run.status === "failed" || run.status === "partial");
  return { runs, isLoading };
}

/**
 * Quantos condomínios ativos já têm boleto emitido neste mês (uma execução que emitiu, ou que encontrou tudo já emitido) e quais ainda não.
 * `ready` só fica verdadeiro quando as duas consultas chegaram.
 */
export function useIssuanceCoverage() {
  const runs = useBillingRunsList({ reference_month: firstDayOfThisMonth(), limit: 100 });
  const condominiums = useCondominiumsList({ active: true, limit: 100 });
  const issuedIds = new Set(
    (runs.data?.results ?? []).filter((run) => run.issued_count + run.already_issued_count > 0).map((run) => run.condominium)
  );
  const active = condominiums.data?.results ?? [];
  const missing = active.filter((condominium) => !issuedIds.has(condominium.id));
  return { ready: Boolean(runs.data && condominiums.data), expected: active.length, issued: active.length - missing.length, missing };
}

/**
 * Client Component: a emissão do mês corrente em reais. O emitido em tipo grande (com a quantidade de boletos ao lado), a barra do que já foi recebido
 * e três colunas de rótulo e valor: recebido (com a %), em aberto e em quantos condomínios já se emitiu. Só se houver execução com problema vem uma linha de aviso.
 */
export function BillingMonthBody() {
  const { current, isLoading } = useBillingSummary(1);
  const { runs, isLoading: loadingRuns } = useRunsWithProblem();
  const coverage = useIssuanceCoverage();
  if (isLoading) return <Skeleton className="h-24 rounded-panel" />;

  const issued = Number(current?.issued_total ?? 0);
  const paid = Number(current?.paid_total ?? 0);
  const share = issued > 0 ? Math.round((paid / issued) * 100) : 0;
  const missing = coverage.ready ? coverage.missing.length : 0;

  return (
    <>
      {!current || current.issued_count === 0 ? (
        <p className="py-2 text-ink-soft">Nenhum boleto emitido neste mês ainda.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-title tabular-nums">{brl(issued)}</span>
            <span className="text-caption text-ink-faint tabular-nums">
              {current.issued_count} boleto{current.issued_count === 1 ? "" : "s"}
            </span>
          </div>
          <div role="img" aria-label={`${share}% recebido`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-[1.2fr_1.2fr_0.8fr] gap-3">
            <div>
              <dt className="text-caption text-ink-faint">Recebido · {share}%</dt>
              <dd className="mt-0.5 text-body tabular-nums">{brl(paid)}</dd>
            </div>
            <div>
              <dt className="text-caption text-ink-faint">Em aberto</dt>
              <dd className="mt-0.5 text-body tabular-nums">{brl(current.open_total)}</dd>
            </div>
            {coverage.ready && coverage.expected > 0 && (
              <div>
                <dt className="text-caption text-ink-faint">Condomínios</dt>
                <dd className="mt-0.5 text-body tabular-nums">
                  <Link href="/billing/runs" className="hover:underline">
                    {missing > 0 ? <Late>{coverage.issued} de {coverage.expected}</Late> : <>{coverage.issued} de {coverage.expected}</>}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </>
      )}
      {!loadingRuns && runs.length > 0 && (
        <Link href="/billing/runs" className="mt-3 block text-caption hover:underline">
          <Late>
            {runs.length} execuç{runs.length === 1 ? "ão" : "ões"} com problema
          </Late>
        </Link>
      )}
    </>
  );
}
