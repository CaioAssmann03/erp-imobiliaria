"use client";

import { useCurrentAccountsBalances } from "@/lib/api/generated";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * O saldo de cada sub-conta (as "partes" do saldo geral: conta normal, fundo de obras…), como um razão: o nome à esquerda e o valor alinhado à
 * direita (vermelho se negativo), uma sub-conta por linha, sem selos nem fundos. A largura é curta para o nome e o valor ficarem perto.
 */
export function StatementBalances({ accountId }: { accountId: string }) {
  const { data } = useCurrentAccountsBalances(accountId);
  const rows = data?.cost_centers ?? [];
  if (rows.length === 0) return null;

  return (
    <dl aria-label="Saldo por sub-conta" className="max-w-sm">
      {rows.map((row) => (
        <div key={row.cost_center} className="flex items-baseline justify-between gap-6 py-1.5">
          <dt className="min-w-0 truncate text-body text-ink-soft">{row.cost_center_name}</dt>
          <dd className={cn("shrink-0 text-body tabular-nums", Number(row.balance) < 0 && "text-danger")}>{brl(row.balance)}</dd>
        </div>
      ))}
    </dl>
  );
}
