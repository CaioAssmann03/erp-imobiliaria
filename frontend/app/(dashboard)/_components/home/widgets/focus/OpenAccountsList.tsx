"use client";

import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { todayIso } from "@/lib/format/format";
import { PAYABLE_WINDOWS, type PayableWindow } from "@/lib/finance/payable-windows";
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

/**
 * A visão de contas a pagar: os botões de janela de vencimento e a lista. As contas já chegam filtradas pela API para a janela escolhida
 * (`due_date_after`/`due_date_before`); aqui só se mostra e se avisa qual janela o usuário pediu.
 */
export function OpenAccountsList({
  accounts,
  total,
  window,
  onWindowChange,
}: {
  accounts: OpenAccount[];
  total: number;
  window: PayableWindow;
  onWindowChange: (window: PayableWindow) => void;
}) {
  const visibleTotal = accounts.reduce((sum, account) => sum + Number(account.amount), 0);

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por vencimento">
        {PAYABLE_WINDOWS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={window === item.id}
            onClick={() => onWindowChange(item.id)}
            className={cn(
              "rounded-full px-3 py-1 text-body transition-colors",
              window === item.id ? "bg-ink text-ink-foreground" : "bg-surface-muted text-ink-soft hover:text-ink"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {accounts.length === 0 ? (
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
            {accounts.length} {accounts.length === 1 ? "conta" : "contas"} · {brl(visibleTotal)}
            {total > accounts.length ? ` (mostrando as ${accounts.length} primeiras de ${total})` : ""}
          </p>
        </>
      )}
    </>
  );
}
