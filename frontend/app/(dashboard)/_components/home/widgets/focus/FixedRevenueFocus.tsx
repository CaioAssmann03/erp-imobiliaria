import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { useDashboardLargestFeesList } from "@/lib/api/generated";
import type { Dashboard } from "@/lib/api/generated/models";

import { brl, integer } from "../format";
import { FOCUS_PAGE_SIZE, FocusList, FocusPager, FocusRow, LedgerRow, percent } from "./parts";

/** Quantas taxas o gráfico mostra, e a altura de cada barra (o gráfico não tem altura própria: ela vem do número de barras). */
const CHART_BARS = 6;
const BAR_HEIGHT_REM = 2.3;

/**
 * Visão completa da receita fixa em duas faixas baixas, separadas por uma linha fina. Em cima, as maiores taxas num gráfico (o maior destacado) e, ao lado, o quadro
 * da receita (total, média e quantos condomínios entram ou ficam de fora). Embaixo, as taxas de todos os condomínios de taxa fixa, da maior para a menor, em
 * duas colunas, 10 por página.
 */
export function FixedRevenueFocus({ dash }: { dash: Dashboard | undefined }) {
  const revenue = dash?.fixed_revenue;
  const [page, setPage] = useState(1);
  const { data: fees } = useDashboardLargestFeesList(
    { limit: FOCUS_PAGE_SIZE, ...(page > 1 ? { page } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  if (!revenue) return <p className="py-6 text-ink-soft">Carregando a receita…</p>;
  if (fees && fees.count === 0) return <p className="py-6 text-ink-soft">Nenhum condomínio com taxa fixa.</p>;

  const total = Number(revenue.monthly_total);
  const average = revenue.fixed_condominiums > 0 ? total / revenue.fixed_condominiums : 0;
  const top = revenue.largest.slice(0, CHART_BARS);

  return (
    <div className="space-y-8">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-[3fr_2fr]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-heading">Maiores taxas</h3>
            <Link href="/condominiums" className="text-body text-ink-soft hover:text-ink hover:underline">
              Ver condomínios →
            </Link>
          </div>
          <div className="mt-3" style={{ height: `${Math.max(top.length, 3) * BAR_HEIGHT_REM}rem` }}>
            <SimpleBarChart
              horizontal
              highlightFirst
              format="currency"
              data={top.map((item) => ({ label: item.name, value: Number(item.amount) }))}
              className="h-full w-full"
            />
          </div>
        </section>

        <section className="md:border-l md:border-border/50 md:pl-10">
          <h3 className="text-heading">Receita por mês</h3>
          <dl className="mt-3">
            <LedgerRow label="Taxa de administração fixa" value={brl(total)} />
            <LedgerRow label="Média por condomínio" value={brl(average)} />
            <LedgerRow label="Condomínios com taxa fixa" value={integer(revenue.fixed_condominiums)} />
            <LedgerRow muted label="Com taxa variável, fora do total" value={integer(revenue.variable_condominiums)} />
          </dl>
        </section>
      </div>

      <div className="border-t border-border/50 pt-8">
        <FocusList title="Todas as taxas">
          <div className="md:columns-2 md:gap-x-10">
            {(fees?.results ?? []).map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <FocusRow
                  href={`/condominiums/${item.id}`}
                  detail={
                    <>
                      <span className="text-body">{brl(item.amount)}</span> <span className="text-ink-faint">{percent(Number(item.amount), total)}%</span>
                    </>
                  }
                >
                  {item.name}
                </FocusRow>
              </div>
            ))}
          </div>
          <FocusPager page={page} count={fees?.count ?? 0} noun={fees?.count === 1 ? "condomínio" : "condomínios"} onPage={setPage} />
        </FocusList>
      </div>
    </div>
  );
}
