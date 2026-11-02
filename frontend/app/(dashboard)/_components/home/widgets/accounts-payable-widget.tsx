import Link from "next/link";

import { accountPayableUrl, accountsPayableUrl } from "@/lib/finance/account-payable-workspace";
import type { AccountsPayable, PayableTotal, UpcomingPayable } from "@/lib/api/generated/models";
import { ROW_LINK } from "@/app/(dashboard)/_components/home/shared/row-link";
import { Late } from "@/app/(dashboard)/_components/home/shared/Late";
import { formatDate, relativeDays } from "@/app/(dashboard)/_components/home/shared/relative-days";

import { Caption } from "./Caption";
import { brl, brlWhole, integer } from "./format";
import { AccountsPayableFocus } from "./focus/AccountsPayableFocus";
import type { WidgetBuilder } from "./types";

const SHORT_LIST = 4;

const accountsLabel = (count: number) => `${integer(count)} conta${count === 1 ? "" : "s"}`;

/** O que pede atenção: o valor atrasado, grande e sozinho; o vermelho fica na nota do pé, que diz quantas contas estão vencidas. */
function Overdue({ value }: { value: PayableTotal | undefined }) {
  return (
    <Link href={accountsPayableUrl("overdue")} title="Abrir as contas atrasadas" className={`${ROW_LINK} block py-1 text-title tabular-nums`}>
      {value ? brlWhole(value.total) : "–"}
    </Link>
  );
}

/** No pé do card: quantas contas estão vencidas (em vermelho) ou que não há atraso. */
function OverdueNote({ value }: { value: PayableTotal | undefined }) {
  if (!value) return null;
  const late = value.count > 0;
  return (
    <p className="mt-auto pt-3 text-caption text-ink-faint">
      {late ? <Late>{accountsLabel(value.count)} vencida{value.count === 1 ? "" : "s"}</Late> : "Nenhuma conta atrasada"}
    </p>
  );
}

/** Uma janela de vencimento como linha de razão: nome, quantidade e valor alinhado à direita; abre a lista das contas daquele período (`?due=`). */
function WindowRow({ label, value, due }: { label: string; value: PayableTotal | undefined; due: string }) {
  return (
    <li>
      <Link href={accountsPayableUrl(due)} title={`Abrir as contas: ${label.toLowerCase()}`} className={`${ROW_LINK} grid grid-cols-[minmax(0,1fr)_auto_7rem] items-baseline gap-x-3 py-2`}>
        <span className="text-ink-soft">{label}</span>
        <span className="text-caption text-ink-faint tabular-nums">{value ? accountsLabel(value.count) : ""}</span>
        <span className="text-right tabular-nums">{value ? brlWhole(value.total) : "–"}</span>
      </Link>
    </li>
  );
}

function UpcomingRow({ account }: { account: UpcomingPayable }) {
  return (
    <li>
      <Link href={accountPayableUrl(account.id)} className={`${ROW_LINK} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5`}>
      <div className="min-w-0">
        <div className="truncate font-medium">{account.description}</div>
        <div className="truncate text-caption text-ink-soft">
          {account.supplier_name} · {account.condominium_name ?? "Despesa da empresa"}
        </div>
      </div>
      <div className="text-right">
        <div className="tabular-nums">{brl(account.amount)}</div>
        <div className="text-caption text-ink-soft">
          {formatDate(account.due_date)} ·{" "}
          {account.overdue ? <Late>{relativeDays(account.due_date)}</Late> : relativeDays(account.due_date)}
        </div>
      </div>
      </Link>
    </li>
  );
}

function Upcoming({ payables, large }: { payables: AccountsPayable | undefined; large: boolean }) {
  const accounts = (payables?.upcoming ?? []).slice(0, large ? undefined : SHORT_LIST);
  if (accounts.length === 0) {
    return <p className="py-6 text-ink-soft">{payables ? "Nenhuma conta em aberto." : "–"}</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {accounts.map((account) => (
        <UpcomingRow key={account.id} account={account} />
      ))}
    </ul>
  );
}

export const buildAccountsPayableWidget: WidgetBuilder = (dash) => {
  const payables = dash?.accounts_payable;

  return {
    title: "Contas a pagar",
    description: "Em aberto, por vencimento (inclui despesas da empresa)",
    className: "lg:col-span-4",
    seeAll: { href: "/finance/accounts-payable" },
    showHeader: true,
    renderFocus: () => <AccountsPayableFocus payables={payables} />,
    render: (large) => (
      <>
        <Overdue value={payables?.overdue} />
        <ul className="mt-4 divide-y divide-border">
          <WindowRow label="Vencem hoje" value={payables?.due_today} due="today" />
          <WindowRow label="Próximos 7 dias" value={payables?.due_next_7_days} due="next_7_days" />
          <WindowRow label="Neste mês" value={payables?.due_this_month} due="this_month" />
        </ul>
        <OverdueNote value={payables?.overdue} />
        {large && (
          <div className="mt-6 border-t border-border pt-4">
            <Caption>Mais antigas em aberto</Caption>
            <Upcoming payables={payables} large={large} />
          </div>
        )}
      </>
    ),
  };
};
