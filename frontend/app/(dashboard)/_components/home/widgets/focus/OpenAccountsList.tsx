"use client";

import Link from "next/link";
import { useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addDays, monthBounds, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Late } from "../../Late";
import { formatDate, relativeDays } from "../../relative-days";
import { brl } from "../format";

export interface OpenAccount {
  id: string;
  description: string;
  supplierName: string;
  condominiumName: string | null;
  dueDate: string;
  amount: string;
}

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

/**
 * A única parte interativa da visão de contas a pagar: os filtros por vencimento e a lista que muda com eles.
 * As contas chegam prontas do servidor; aqui só se filtra.
 */
export function OpenAccountsList({ accounts, total }: { accounts: OpenAccount[]; total: number }) {
  const [window, setWindow] = useState<Window>("all");
  const visible = accounts.filter((account) => inWindow(window, account.dueDate));
  const visibleTotal = visible.reduce((sum, account) => sum + Number(account.amount), 0);

  return (
    <>
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

      {visible.length === 0 ? (
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
              {visible.map((account) => {
                const overdue = account.dueDate < todayIso();
                return (
                  <TableRow key={account.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="tabular-nums">{formatDate(account.dueDate)}</div>
                      <div className="text-caption text-ink-soft">
                        {overdue ? <Late>{relativeDays(account.dueDate)}</Late> : relativeDays(account.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/finance/accounts-payable/${account.id}`} className="font-medium hover:underline">
                        {account.description}
                      </Link>
                      <div className="text-caption text-ink-soft">{account.supplierName}</div>
                    </TableCell>
                    <TableCell className="hidden text-ink-soft md:table-cell">{account.condominiumName ?? "Despesa da empresa"}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(account.amount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-caption text-ink-soft">
            {visible.length} {visible.length === 1 ? "conta" : "contas"} · {brl(visibleTotal)}
            {total > accounts.length ? ` (mostrando as ${accounts.length} primeiras de ${total})` : ""}
          </p>
        </>
      )}
    </>
  );
}
