"use client";

import { useCurrentAccountsBalances } from "@/lib/api/generated";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

/** O saldo de cada sub-conta (as "partes" do saldo geral: conta normal, fundo de obras…), como etiquetas discretas. */
export function StatementBalances({ accountId }: { accountId: string }) {
  const { data } = useCurrentAccountsBalances(accountId);
  const rows = data?.cost_centers ?? [];
  if (rows.length === 0) return null;

  return (
    <ul aria-label="Saldo por sub-conta" className="flex flex-wrap gap-2">
      {rows.map((row) => (
        <li
          key={row.cost_center}
          className="flex items-baseline gap-2 rounded-full bg-ink/5 px-3 py-1 text-caption text-ink-soft"
        >
          <span className="truncate">{row.cost_center_name}</span>
          <span className={cn("tabular-nums text-ink", Number(row.balance) < 0 && "text-danger")}>{brl(row.balance)}</span>
        </li>
      ))}
    </ul>
  );
}
