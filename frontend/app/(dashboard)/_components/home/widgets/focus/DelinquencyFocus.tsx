"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { useBillingDocumentsDelinquency } from "@/lib/api/generated";

import { brl, integer } from "../format";
import { FOCUS_PAGE_SIZE, FocusList, FocusPager, FocusRow, LedgerRow, boletos, percent } from "./parts";

/** Quantos condomínios o gráfico mostra, e a altura de cada barra (o gráfico não tem altura própria: ela vem do número de barras). */
const CHART_BARS = 6;
const BAR_HEIGHT_REM = 2.3;

/**
 * Client Component: a inadimplência em duas faixas baixas, separadas por uma linha fina. Em cima, os condomínios que mais devem num gráfico (o maior destacado) e,
 * ao lado, o quadro do que está vencido e não pago. Embaixo, os boletos mais atrasados em linhas simples, em duas colunas, 10 por página (`?page=` do relatório).
 */
export function DelinquencyFocus() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBillingDocumentsDelinquency(
    { condominiums_order: "amount", rows_order: "oldest", page_size: FOCUS_PAGE_SIZE, page },
    { query: { placeholderData: keepPreviousData } }
  );
  if (!data) return <p className="py-6 text-ink-soft">{isLoading ? "Carregando a inadimplência…" : "Não foi possível carregar a inadimplência."}</p>;
  if (data.count === 0) return <p className="py-6 text-ink-soft">Nenhum boleto vencido. Tudo em dia.</p>;

  const total = Number(data.total_amount);
  const condominiums = data.by_condominium.slice(0, CHART_BARS);
  const [top] = data.by_condominium;

  return (
    <div className="space-y-8">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-[3fr_2fr]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-heading">Por condomínio</h3>
            <Link href="/reports/delinquency" className="text-body text-ink-soft hover:text-ink hover:underline">
              Relatório →
            </Link>
          </div>
          <div className="mt-3" style={{ height: `${Math.max(condominiums.length, 3) * BAR_HEIGHT_REM}rem` }}>
            <SimpleBarChart
              horizontal
              highlightFirst
              format="currency"
              data={condominiums.map((item) => ({ label: item.condominium_name, value: Number(item.total_amount) }))}
              className="h-full w-full"
            />
          </div>
        </section>

        <section className="md:border-l md:border-border/50 md:pl-10">
          <h3 className="text-heading">Em atraso</h3>
          <dl className="mt-3">
            <LedgerRow label="Vencido e não pago" detail={boletos(data.count)} value={brl(total)} />
            <LedgerRow label="Condomínios com atraso" value={integer(data.by_condominium.length)} />
            {top && <LedgerRow muted label={`Maior: ${top.condominium_name}`} detail={`${percent(Number(top.total_amount), total)}%`} value={brl(top.total_amount)} />}
          </dl>
        </section>
      </div>

      <div className="border-t border-border/50 pt-8">
        <FocusList title="Mais atrasados">
          <div className="md:columns-2 md:gap-x-10">
            {data.rows.map((row) => (
              <div key={row.document_id} title={row.payer_name} className="break-inside-avoid">
                <FocusRow
                  href={`/billing/documents/${row.document_id}`}
                  detail={
                    <>
                      <span className="text-body">{brl(row.amount)}</span> <span className="text-danger">{row.days_overdue} d</span>
                    </>
                  }
                >
                  {row.condominium_name} · {row.unit_name}
                </FocusRow>
              </div>
            ))}
          </div>
          <FocusPager page={page} count={data.count} noun={data.count === 1 ? "boleto" : "boletos"} onPage={setPage} />
        </FocusList>
      </div>
    </div>
  );
}
