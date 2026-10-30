"use client";

import { useCurrentAccountsBalances } from "@/lib/api/generated";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A seção `subcontas` do extrato: o saldo de cada sub-conta (conta normal, fundo de obras…), como um razão: o nome à esquerda e o valor alinhado à
 * direita (vermelho se negativo), uma sub-conta por linha, sem selos nem fundos. É o mesmo dinheiro do saldo de cima visto por sub-conta (a soma das
 * sub-contas é o saldo total), não um desconto dele; por isso fica separada, com título e a legenda dizendo isso. A largura é curta para o nome e o
 * valor ficarem perto.
 */
export function StatementBalances({ accountId }: { accountId: string | undefined }) {
  const { data } = useCurrentAccountsBalances(accountId ?? "", { query: { enabled: Boolean(accountId) } });
  const rows = data?.cost_centers ?? [];

  return (
    <section id="subcontas" aria-labelledby="statement-subcontas" className="mt-8 scroll-mt-20 border-t border-line pt-6">
      <h2 id="statement-subcontas" className="text-heading">
        Saldo por sub-conta
      </h2>
      <p className="mt-0.5 text-caption text-ink-soft">O mesmo saldo dividido por sub-conta: a soma delas é o saldo total, não um desconto dele.</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-body text-ink-soft">Nenhuma sub-conta teve movimento ainda.</p>
      ) : (
        <dl aria-label="Saldo por sub-conta" className="mt-4 max-w-sm">
          {rows.map((row) => (
            <div key={row.cost_center} className="flex items-baseline justify-between gap-6 py-1.5">
              <dt className="min-w-0 truncate text-body text-ink-soft">{row.cost_center_name}</dt>
              <dd className={cn("shrink-0 text-body tabular-nums", Number(row.balance) < 0 && "text-danger")}>{brl(row.balance)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
