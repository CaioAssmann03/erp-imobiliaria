"use client";

import { todayIso } from "@/lib/format/format";
import { PAYABLE_WINDOWS, type PayableWindow } from "@/lib/finance/payable-windows";
import { cn } from "@/lib/utils";

import { Late } from "@/app/(dashboard)/_components/home/shared/Late";
import { relativeDays } from "@/app/(dashboard)/_components/home/shared/relative-days";
import { brl } from "../format";
import { FocusPager, FocusRow } from "./parts";

export interface OpenAccount {
  id: string;
  description: string;
  supplierName: string;
  condominiumName: string | null;
  dueDate: string;
  amount: string;
}

/**
 * A visão de contas a pagar: as janelas de vencimento como texto e a lista, em duas colunas. As contas já chegam filtradas pela API para a janela escolhida
 * (`due_date_after`/`due_date_before`) e a página (10 contas); aqui só se mostra e se avisa qual janela o usuário pediu.
 */
export function OpenAccountsList({
  accounts,
  total,
  page,
  onPageChange,
  window,
  onWindowChange,
}: {
  accounts: OpenAccount[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  window: PayableWindow;
  onWindowChange: (window: PayableWindow) => void;
}) {
  const today = todayIso();

  return (
    <>
      <div className="-mt-1 mb-3 flex flex-wrap gap-1" role="group" aria-label="Filtrar por vencimento">
        {PAYABLE_WINDOWS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={window === item.id}
            onClick={() => onWindowChange(item.id)}
            className={cn(
              "rounded-button px-3 py-1 text-body transition-colors",
              window === item.id ? "bg-surface-muted text-ink" : "text-ink-soft hover:text-ink"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {accounts.length === 0 ? (
        <p className="px-3 py-6 text-ink-soft">Nenhuma conta neste filtro.</p>
      ) : (
        <>
          <div className="md:columns-2 md:gap-x-10">
            {accounts.map((account) => (
              <div key={account.id} className="break-inside-avoid">
                <FocusRow
                  href={`/finance/accounts-payable/${account.id}`}
                  sub={`${account.supplierName} · ${account.condominiumName ?? "Despesa da empresa"}`}
                  detail={
                    <>
                      <span className="block text-body">{brl(account.amount)}</span>
                      <span className="block text-ink-soft">{account.dueDate < today ? <Late>{relativeDays(account.dueDate)}</Late> : relativeDays(account.dueDate)}</span>
                    </>
                  }
                >
                  {account.description}
                </FocusRow>
              </div>
            ))}
          </div>
          <FocusPager page={page} count={total} noun={total === 1 ? "conta" : "contas"} onPage={onPageChange} />
        </>
      )}
    </>
  );
}
