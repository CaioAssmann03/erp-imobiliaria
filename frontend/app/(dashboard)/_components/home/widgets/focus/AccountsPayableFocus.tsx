"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { useAccountsPayableList } from "@/lib/api/generated";
import type { AccountsPayable, PayableTotal } from "@/lib/api/generated/models";
import { todayIso } from "@/lib/format/format";
import { accountsPayableUrl } from "@/lib/finance/account-payable-workspace";
import { WINDOW_DUE, windowRange, type PayableWindow } from "@/lib/finance/payable-windows";

import { brl } from "../format";
import { OpenAccountsList } from "./OpenAccountsList";
import { FOCUS_PAGE_SIZE, FocusList, LegendDot, SegmentedBar } from "./parts";

const countLabel = (count: number) => `${count} ${count === 1 ? "conta" : "contas"}`;

/** Uma janela da legenda: o nome (com o ponto da cor da barra, quando tem), o valor e a quantidade de contas. */
function WindowFigure({ label, value, dot }: { label: string; value: PayableTotal | undefined; dot?: string }) {
  return (
    <div>
      <dt className="text-ink-soft">
        {dot && <LegendDot className={dot} />}
        {label}
      </dt>
      <dd className="mt-1 text-heading tabular-nums">{value ? brl(value.total) : "–"}</dd>
      <dd className="text-caption tabular-nums text-ink-faint">{value ? countLabel(value.count) : ""}</dd>
    </div>
  );
}

/**
 * Client Component: as contas a pagar em duas faixas baixas. Em cima, a barra do que está atrasado, vence hoje e vence nos próximos 7 dias (janelas que não se
 * sobrepõem), com a legenda em valores; "Neste mês" fica à parte, porque inclui parte das outras. Embaixo, as contas em aberto em duas colunas: a janela
 * escolhida vai à API (`windowRange`), 10 contas por página.
 */
export function AccountsPayableFocus({ payables }: { payables: AccountsPayable | undefined }) {
  const [window, setWindow] = useState<PayableWindow>("all");
  const [page, setPage] = useState(1);
  const { data: open, isLoading } = useAccountsPayableList(
    { status: "open", limit: FOCUS_PAGE_SIZE, ...(page > 1 ? { page } : {}), ...windowRange(window, todayIso()) },
    { query: { placeholderData: keepPreviousData } }
  );
  const accounts = (open?.results ?? []).map((account) => ({
    id: account.id,
    description: account.description,
    supplierName: account.supplier_name,
    condominiumName: account.condominium_name ?? null,
    dueDate: account.due_date,
    amount: account.amount,
  }));

  const overdue = Number(payables?.overdue.total ?? 0);
  const today = Number(payables?.due_today.total ?? 0);
  const week = Number(payables?.due_next_7_days.total ?? 0);
  const segments = [
    { value: overdue, className: "bg-danger" },
    { value: today, className: "bg-brand" },
    { value: week, className: "bg-ink-faint" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-heading">A pagar</h3>
          <Link href="/finance/accounts-payable/new" className="text-body text-ink-soft hover:text-ink hover:underline">
            Nova conta →
          </Link>
        </div>
        <div className="mt-4">
          <SegmentedBar label="Atrasadas, hoje e próximos 7 dias" max={overdue + today + week} segments={segments} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-10 gap-y-5 md:grid-cols-4">
          <WindowFigure label="Atrasadas" value={payables?.overdue} dot={segments[0].className} />
          <WindowFigure label="Vencem hoje" value={payables?.due_today} dot={segments[1].className} />
          <WindowFigure label="Próximos 7 dias" value={payables?.due_next_7_days} dot={segments[2].className} />
          <div className="md:border-l md:border-border/50 md:pl-10">
            <WindowFigure label="Neste mês" value={payables?.due_this_month} />
          </div>
        </dl>
      </section>

      <div className="border-t border-border/50 pt-8">
        <FocusList title="Contas em aberto" action={{ href: accountsPayableUrl(WINDOW_DUE[window]), label: "Ver todas" }}>
          {open ? (
            <OpenAccountsList
              accounts={accounts}
              total={open.count}
              page={page}
              onPageChange={setPage}
              window={window}
              onWindowChange={(next) => {
                setWindow(next);
                setPage(1);
              }}
            />
          ) : (
            <p className="px-3 py-6 text-ink-soft">{isLoading ? "Carregando as contas…" : "Não foi possível carregar as contas."}</p>
          )}
        </FocusList>
      </div>
    </div>
  );
}
