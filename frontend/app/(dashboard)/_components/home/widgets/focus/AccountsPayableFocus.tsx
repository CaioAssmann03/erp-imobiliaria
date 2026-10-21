"use client";

import Link from "next/link";
import { useState } from "react";

import { LinkButton } from "@/components/LinkButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountsPayableList } from "@/lib/api/generated";
import type { AccountsPayable } from "@/lib/api/generated/models";
import { addDays, monthBounds, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Late } from "../../Late";
import { formatDate, relativeDays } from "../../relative-days";
import { brl } from "../format";
import { FocusSection, FocusStat } from "./parts";

const countLabel = (count: number) => `${count} ${count === 1 ? "conta" : "contas"}`;

type Window = "all" | "overdue" | "today" | "week" | "month";

const WINDOWS: { id: Window; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "overdue", label: "Atrasadas" },
  { id: "today", label: "Vencem hoje" },
  { id: "week", label: "Próximos 7 dias" },
  { id: "month", label: "Neste mês" },
];

function inWindow(window: Window, dueDate: string): boolean {
  const today = todayIso();
  if (window === "overdue") return dueDate < today;
  if (window === "today") return dueDate === today;
  if (window === "week") return dueDate >= today && dueDate <= addDays(today, 7);
  if (window === "month") return dueDate >= today && dueDate <= monthBounds(today).to;
  return true;
}

/** Visão completa das contas a pagar: os totais por janela e a lista das contas em aberto, filtrável por vencimento. */
export function AccountsPayableFocus({ payables }: { payables: AccountsPayable | undefined }) {
  const [window, setWindow] = useState<Window>("all");
  const { data, isLoading } = useAccountsPayableList({ status: "open", limit: 100 });

  const accounts = [...(data?.results ?? [])]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .filter((account) => inWindow(window, account.due_date));
  const selectedTotal = accounts.reduce((sum, account) => sum + Number(account.amount), 0);

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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por vencimento">
          {WINDOWS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={window === item.id}
              onClick={() => setWindow(item.id)}
              className={cn(
                "rounded-full px-3 py-1 text-body transition-colors",
                window === item.id ? "bg-ink text-ink-foreground" : "bg-surface-muted text-ink-soft hover:text-ink"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-6 text-ink-soft">Carregando…</p>
        ) : accounts.length === 0 ? (
          <p className="py-6 text-ink-soft">Nenhuma conta neste filtro.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="hidden md:table-cell">Condomínio</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const overdue = account.due_date < todayIso();
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="tabular-nums">{formatDate(account.due_date)}</div>
                        <div className="text-caption text-ink-soft">
                          {overdue ? <Late>{relativeDays(account.due_date)}</Late> : relativeDays(account.due_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/finance/accounts-payable/${account.id}`} className="font-medium hover:underline">
                          {account.description}
                        </Link>
                        <div className="text-caption text-ink-soft">{account.supplier_name}</div>
                      </TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{account.condominium_name ?? "Despesa da empresa"}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(account.amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="text-caption text-ink-soft">
              {accounts.length} {accounts.length === 1 ? "conta" : "contas"} · {brl(selectedTotal)}
              {data && data.count > 100 ? ` (mostrando as 100 primeiras de ${data.count})` : ""}
            </p>
          </>
        )}
      </FocusSection>

      <LinkButton variant="secondary" href="/finance/accounts-payable/new">
        Nova conta a pagar
      </LinkButton>
    </div>
  );
}
