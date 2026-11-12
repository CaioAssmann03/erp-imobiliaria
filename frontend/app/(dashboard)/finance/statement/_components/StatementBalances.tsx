"use client";

import { useCurrentAccountsBalances } from "@/lib/api/generated";
import { brl } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/**
 * O saldo de cada sub-conta (conta normal, fundo de obras…), ao lado do saldo total na seção `saldo` do extrato: cada uma é um item da mesma fileira, o
 * nome pequeno em cima e o valor embaixo (vermelho se negativo), sem título, legenda, divisória nem fundo. Devolve só os itens (`div`), para entrarem no
 * `dl` de quem o usa; sem movimento nenhum não mostra nada.
 */
export function StatementBalances({ accountId }: { accountId: string | undefined }) {
  const { data } = useCurrentAccountsBalances(accountId ?? "", { query: { enabled: Boolean(accountId) } });

  return (
    <>
      {(data?.cost_centers ?? []).map((row) => (
        <div key={row.cost_center} className="min-w-0">
          <dt className="truncate text-caption text-ink-soft">{row.cost_center_name}</dt>
          <dd className={cn("text-heading tabular-nums", Number(row.balance) < 0 && "text-danger")}>{brl(row.balance)}</dd>
        </div>
      ))}
    </>
  );
}
