"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useBillingRunsCoverage, useBillingRunsList } from "@/lib/api/generated";
import { useBillingSummary } from "@/app/(dashboard)/_components/home/shared/use-billing-summary";
import { brlWhole, integer } from "@/app/(dashboard)/_components/home/widgets/format";

const oneDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const firstDayOfThisMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
};

/** As execuções da emissão do mês corrente que terminaram com problema (condomínio sem boleto): uma consulta por situação, falha e parcial, que a API filtra. */
export function useRunsWithProblem() {
  const month = firstDayOfThisMonth();
  const failed = useBillingRunsList({ reference_month: month, status: "failed", limit: 100 });
  const partial = useBillingRunsList({ reference_month: month, status: "partial", limit: 100 });
  const runs = [...(failed.data?.results ?? []), ...(partial.data?.results ?? [])];
  return { runs, isLoading: failed.isLoading || partial.isLoading };
}

/**
 * Quantos condomínios ativos já têm boleto emitido neste mês (uma execução que emitiu, ou que encontrou tudo já emitido) e quais ainda não: a conta é da API
 * (`/billing-runs/coverage/`). `ready` fica verdadeiro quando a resposta chegou.
 */
export function useIssuanceCoverage() {
  const { data } = useBillingRunsCoverage({ reference_month: firstDayOfThisMonth() });
  return { ready: Boolean(data), expected: data?.expected ?? 0, issued: data?.issued ?? 0, missing: data?.missing ?? [] };
}

/**
 * Client Component: a emissão do mês corrente: o emitido sozinho em tipo grande, a barra fina do que já foi recebido, uma linha com o percentual
 * recebido e o valor em aberto e, em duas linhas de detalhe, quantos boletos já foram pagos e quanto se recebeu do mês anterior (para comparar).
 * No pé, a quantidade de boletos emitidos e, só quando ainda falta algum condomínio, em quantos já se emitiu (com link para as emissões).
 * As execuções com problema ficam na visão ampliada.
 */
export function BillingMonthBody() {
  const { lines, current, isLoading } = useBillingSummary(2);
  const coverage = useIssuanceCoverage();
  if (isLoading) return <Skeleton className="h-24 rounded-panel" />;

  const issued = Number(current?.issued_total ?? 0);
  const paid = Number(current?.paid_total ?? 0);
  const rate = issued > 0 ? (paid / issued) * 100 : 0;
  const previous = lines.length > 1 && Number(lines[0].issued_total) > 0 ? lines[0] : undefined;
  const previousRate = previous ? (Number(previous.paid_total) / Number(previous.issued_total)) * 100 : null;
  const missing = coverage.ready ? coverage.missing.length : 0;
  const count = current?.issued_count ?? 0;

  return (
    <>
      {!current || current.issued_count === 0 ? (
        <p className="py-2 text-ink-soft">Nenhum boleto emitido neste mês ainda.</p>
      ) : (
        <>
          <div className="text-title tabular-nums">{brlWhole(issued)}</div>
          <div role="img" aria-label={`${oneDecimal.format(rate)}% recebido`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-faint/30">
            <div className="h-full rounded-full bg-brand" style={{ width: `${rate}%` }} />
          </div>
          <p className="mt-3 text-ink-soft tabular-nums">
            {oneDecimal.format(rate)}% recebido · {brlWhole(current.open_total)} em aberto
          </p>
          <dl className="mt-4 divide-y divide-border tabular-nums">
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-ink-soft">Boletos pagos</dt>
              <dd>
                {integer(current.paid_count)} <span className="text-ink-faint">de</span> {integer(current.issued_count)}
              </dd>
            </div>
            {previousRate !== null && (
              <div className="flex items-baseline justify-between gap-3 py-2">
                <dt className="text-ink-soft">Mês anterior</dt>
                <dd>{oneDecimal.format(previousRate)}% recebido</dd>
              </div>
            )}
          </dl>
          <p className="mt-auto pt-3 text-caption text-ink-faint tabular-nums">
            {integer(count)} boleto{count === 1 ? "" : "s"} emitido{count === 1 ? "" : "s"}
            {missing > 0 && (
              <>
                {" · "}
                <Link href="/billing/runs" className="hover:text-ink hover:underline">
                  {integer(coverage.issued)} de {integer(coverage.expected)} condomínios
                </Link>
              </>
            )}
          </p>
        </>
      )}
    </>
  );
}
