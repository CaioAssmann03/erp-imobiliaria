"use client";

import Link from "next/link";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Skeleton } from "@/components/ui/skeleton";
import { billingDocumentsDelinquencyPdf, useBillingDocumentsDelinquency } from "@/lib/api/generated";
import { brl, todayIso } from "@/lib/format/format";
import { delinquencyPdfName } from "@/lib/reports/reports";
import { cn } from "@/lib/utils";

import { PayableWindows } from "./PayableWindows";
import { ReportDownloadButton } from "./ReportDownloadButton";

/** Uma linha do hub: o relatório inteiro é o link (nome e uma frase), com o dado do dia em texto discreto à direita e, se houver, uma ação ao lado. */
function Row({ href, title, note, aside, action }: { href: string; title: string; note: string; aside?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-panel transition-colors focus-within:bg-surface-muted hover:bg-surface-muted">
      <Link href={href} className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-panel px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
        <span className="min-w-0">
          <span className="block truncate text-body font-medium">{title}</span>
          <span className="block truncate text-caption text-ink-soft">{note}</span>
        </span>
        {aside}
      </Link>
      {action && <div className="shrink-0 pr-3">{action}</div>}
    </li>
  );
}

/** Quantos condomínios o gráfico de quem mais deve mostra. */
const TOP_DEBTORS = 5;

/** Um gráfico do hub: o título pequeno em cinza e o gráfico, sem cartão por fora. */
function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <h2 className="mb-3 text-caption text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Client Component: a tela de `/reports` sem relatório aberto: um título, uma frase, os relatórios que já existem, cada um numa linha só (nome, o que
 * mostra e, à direita, um dado do dia em texto discreto) e, embaixo, dois gráficos: os condomínios que mais devem (só quando há atraso)
 * e as contas a pagar por janela de vencimento, numa barra segmentada (`PayableWindows`). Sem números grandes, cartões internos, ícones nem linhas divisórias.
 */
export function ReportsOverview() {
  const { data } = useBillingDocumentsDelinquency({ condominiums_order: "amount" });
  const late = (data?.count ?? 0) > 0;
  const debtors = (data?.by_condominium ?? [])
    .slice(0, TOP_DEBTORS)
    .map((line) => ({ label: line.condominium_name, value: Number(line.total_amount) }));

  return (
    <div className="rounded-card bg-surface p-6 sm:p-8">
      <h1 className="text-title">Relatórios</h1>
      <p className="mt-1 text-body text-ink-soft">Abra um relatório aqui ou na lista ao lado.</p>

      <ul className="mt-6 space-y-1">
        <Row
          href="/reports/delinquency"
          title="Inadimplência"
          note="Boletos vencidos e ainda não pagos"
          aside={
            data ? (
              <span className={cn("shrink-0 text-body tabular-nums", late ? "text-danger" : "text-ink-soft")}>{late ? brl(data.total_amount) : "Em dia"}</span>
            ) : (
              <Skeleton className="h-5 w-24 rounded-control" />
            )
          }
          action={
            <ReportDownloadButton
              variant="link"
              fileName={delinquencyPdfName(data?.as_of ?? todayIso())}
              fetchPdf={() => billingDocumentsDelinquencyPdf({})}
              disabled={!late}
            />
          }
        />
        <Row href="/reports/accountability" title="Prestação de contas" note="Saldo anterior, créditos, débitos e saldo final, por sub-conta" />
      </ul>

      <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-2">
        {late && (
          <ChartBlock title="Quem mais deve">
            <SimpleBarChart data={debtors} horizontal format="currency" className="h-44 w-full" />
          </ChartBlock>
        )}
        <ChartBlock title="Contas a pagar">
          <PayableWindows />
        </ChartBlock>
      </div>
    </div>
  );
}
