"use client";

import Link from "next/link";

import { billingDocumentsDelinquencyPdf, useBillingDocumentsDelinquency } from "@/lib/api/generated";
import { brl, formatMonth, todayIso } from "@/lib/format";
import { delinquencyPdfName } from "@/lib/reports";
import { cn } from "@/lib/utils";

import { ReportDownloadButton } from "./ReportDownloadButton";

/** Uma entrada do panorama: o nome, o dado do dia em tipo grande, a explicação e as ações em texto, separada das outras por um fio. */
function Entry({ title, figure, note, tone, children }: { title: string; figure: React.ReactNode; note: React.ReactNode; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section className="py-8 first:pt-0 last:pb-0">
      <h2 className="text-caption font-medium text-ink-soft">{title}</h2>
      <p className={cn("mt-2 text-display tabular-nums", tone === "danger" && "text-danger")}>{figure}</p>
      <p className="mt-1 text-body text-ink-soft">{note}</p>
      <div className="mt-4 flex items-center gap-5">{children}</div>
    </section>
  );
}

const actionClass = "text-body font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:underline";

/**
 * Client Component: a tela de `/reports` sem relatório aberto, em vez de um "escolha um": o panorama dos relatórios que já existem, cada um
 * com o dado do dia (o valor vencido; o mês corrente) e as ações em texto: abrir e baixar o PDF. Sem cartões nem ícones.
 */
export function ReportsOverview() {
  const { data } = useBillingDocumentsDelinquency();
  const late = (data?.count ?? 0) > 0;
  const today = todayIso();

  return (
    <div className="rounded-card bg-surface px-8 py-8 sm:px-10 sm:py-10 divide-y divide-border">
      <Entry
        title="Inadimplência"
        tone={late ? "danger" : undefined}
        figure={data ? brl(data.total_amount) : "–"}
        note={
          !data
            ? "Boletos vencidos e ainda não pagos."
            : late
              ? `${data.count} boleto${data.count === 1 ? "" : "s"} vencido${data.count === 1 ? "" : "s"} em ${data.by_condominium.length} condomínio${data.by_condominium.length === 1 ? "" : "s"}`
              : "Nenhum boleto vencido. Tudo em dia."
        }
      >
        <Link href="/reports/delinquency" className={actionClass}>
          Abrir relatório →
        </Link>
        <ReportDownloadButton
          variant="link"
          fileName={delinquencyPdfName(data?.as_of ?? today)}
          fetchPdf={() => billingDocumentsDelinquencyPdf({})}
          disabled={!late}
        />
      </Entry>

      <Entry
        title="Prestação de contas"
        figure={formatMonth(`${today.slice(0, 7)}-01`)}
        note="Escolha o condomínio e o mês: saldo anterior, créditos, débitos e saldo final, por sub-conta."
      >
        <Link href="/reports/accountability" className={actionClass}>
          Abrir relatório →
        </Link>
      </Entry>
    </div>
  );
}
