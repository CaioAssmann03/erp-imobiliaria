"use client";

import { useCurrentAccountsBalances } from "@/lib/api/generated";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Saldo de cada sub-conta do extrato (as "partes" do saldo geral: conta normal, fundo de obras…). */
export function StatementBalances({ accountId }: { accountId: string }) {
  const { data } = useCurrentAccountsBalances(accountId);
  const rows = data?.cost_centers ?? [];
  if (rows.length === 0) return null;

  return (
    <section aria-label="Saldo por sub-conta" className="mb-3 rounded-card bg-card p-4 shadow-card">
      <h2 className="mb-3 text-caption font-medium text-ink-soft">Saldo por sub-conta</h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.cost_center} className="flex items-baseline justify-between gap-4">
            <dt className="truncate text-body text-ink-soft">{row.cost_center_name}</dt>
            <dd className={cn("tabular-nums", Number(row.balance) < 0 && "text-danger")}>{brl(row.balance)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
