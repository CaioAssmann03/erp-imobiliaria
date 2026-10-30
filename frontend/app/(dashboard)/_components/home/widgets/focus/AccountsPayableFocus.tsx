"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { LinkButton } from "@/components/LinkButton";
import { useAccountsPayableList } from "@/lib/api/generated";
import type { AccountsPayable } from "@/lib/api/generated/models";
import { todayIso } from "@/lib/format/format";
import { windowRange, type PayableWindow } from "@/lib/finance/payable-windows";

import { brl } from "../format";
import { OpenAccountsList } from "./OpenAccountsList";
import { FocusSection, FocusStat } from "./parts";

const countLabel = (count: number) => `${count} ${count === 1 ? "conta" : "contas"}`;
const LIST_LIMIT = 100;

/** Client Component: os totais por janela e as contas em aberto; a janela de vencimento escolhida vai à API (`windowRange`) e a lista é o `OpenAccountsList`. */
export function AccountsPayableFocus({ payables }: { payables: AccountsPayable | undefined }) {
  const [window, setWindow] = useState<PayableWindow>("all");
  const { data: open, isLoading } = useAccountsPayableList(
    { status: "open", limit: LIST_LIMIT, ...windowRange(window, todayIso()) },
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FocusStat
          label="Atrasadas"
          value={payables ? brl(payables.overdue.total) : "–"}
          tone={(payables?.overdue.count ?? 0) > 0 ? "danger" : "default"}
          hint={payables ? countLabel(payables.overdue.count) : undefined}
        />
        <FocusStat label="Vencem hoje" value={payables ? brl(payables.due_today.total) : "–"} hint={payables ? countLabel(payables.due_today.count) : undefined} />
        <FocusStat label="Próximos 7 dias" value={payables ? brl(payables.due_next_7_days.total) : "–"} hint={payables ? countLabel(payables.due_next_7_days.count) : undefined} />
        <FocusStat label="Neste mês" value={payables ? brl(payables.due_this_month.total) : "–"} hint={payables ? countLabel(payables.due_this_month.count) : undefined} />
      </div>

      <FocusSection title="Contas em aberto" action={{ href: "/finance/accounts-payable", label: "Ver todas" }}>
        {open ? (
          <OpenAccountsList accounts={accounts} total={open.count} window={window} onWindowChange={setWindow} />
        ) : (
          <p className="py-6 text-ink-soft">{isLoading ? "Carregando as contas…" : "Não foi possível carregar as contas."}</p>
        )}
      </FocusSection>

      <LinkButton variant="secondary" href="/finance/accounts-payable/new">
        Nova conta a pagar
      </LinkButton>
    </div>
  );
}
