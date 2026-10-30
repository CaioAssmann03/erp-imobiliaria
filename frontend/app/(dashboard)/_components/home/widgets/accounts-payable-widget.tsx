import { cn } from "@/lib/utils";
import type { AccountsPayable, PayableTotal, UpcomingPayable } from "@/lib/api/generated/models";

import { Late } from "../Late";
import { formatDate, relativeDays } from "../relative-days";
import { Caption } from "./Caption";
import { brl } from "./format";
import { AccountsPayableFocus } from "./focus/AccountsPayableFocus";
import type { WidgetBuilder } from "./types";

const SHORT_LIST = 4;

const accountsLabel = (count: number) => `${count} conta${count === 1 ? "" : "s"}`;

/** O que pede atenção: o valor atrasado, grande, e em vermelho só quando há atraso. */
function Overdue({ value }: { value: PayableTotal | undefined }) {
  const late = (value?.count ?? 0) > 0;
  return (
    <div>
      <div className={cn("text-title tabular-nums", late && "text-danger")}>{value ? brl(value.total) : "–"}</div>
      <Caption>
        {!value ? "" : late ? `${accountsLabel(value.count)} vencida${value.count === 1 ? "" : "s"}` : "Nenhuma conta atrasada"}
      </Caption>
    </div>
  );
}

/** Uma janela de vencimento como linha de razão: nome, quantidade e valor alinhado à direita. */
function WindowRow({ label, value }: { label: string; value: PayableTotal | undefined }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_7rem] items-baseline gap-x-3 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-caption text-ink-faint tabular-nums">{value ? accountsLabel(value.count) : ""}</dd>
      <dd className="text-right tabular-nums">{value ? brl(value.total) : "–"}</dd>
    </div>
  );
}

function UpcomingRow({ account }: { account: UpcomingPayable }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
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
        <dl className="mt-4 divide-y divide-border">
          <WindowRow label="Vencem hoje" value={payables?.due_today} />
          <WindowRow label="Próximos 7 dias" value={payables?.due_next_7_days} />
          <WindowRow label="Neste mês" value={payables?.due_this_month} />
        </dl>
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
