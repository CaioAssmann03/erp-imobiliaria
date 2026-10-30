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

/** Uma janela de vencimento: o valor, grande, e a quantidade de contas; o atrasado fica em vermelho só quando há atraso. */
function Figure({ label, value, late = false }: { label: string; value: PayableTotal | undefined; late?: boolean }) {
  const alert = late && (value?.count ?? 0) > 0;
  return (
    <div className="min-w-0 px-5 first:pl-0 last:pr-0 max-sm:px-0 max-sm:py-3">
      <Caption>{label}</Caption>
      <div className={cn("mt-0.5 truncate text-heading tabular-nums sm:text-title", alert && "text-danger")}>{value ? brl(value.total) : "–"}</div>
      <div className="text-caption text-ink-faint">{value ? accountsLabel(value.count) : ""}</div>
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
    className: "lg:col-span-8",
    seeAll: { href: "/finance/accounts-payable" },
    showHeader: true,
    renderFocus: () => <AccountsPayableFocus payables={payables} />,
    render: (large) => (
      <>
        <div className="grid grid-cols-2 gap-y-2 sm:grid-cols-4 sm:divide-x sm:divide-border">
          <Figure label="Atrasadas" value={payables?.overdue} late />
          <Figure label="Vencem hoje" value={payables?.due_today} />
          <Figure label="Próximos 7 dias" value={payables?.due_next_7_days} />
          <Figure label="Neste mês" value={payables?.due_this_month} />
        </div>
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
