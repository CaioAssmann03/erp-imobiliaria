import Link from "next/link";

import type { Condominium } from "@/lib/api/generated/models";
import { brl } from "@/lib/format/format";
import { statementUrl } from "@/lib/finance/statement-workspace";
import { cn } from "@/lib/utils";

/**
 * Um condomínio na lista do extrato, no padrão da lista de condomínios: o código (cinza) e o nome em cima e embaixo o saldo da conta corrente
 * (vermelho se negativo; "Sem lançamentos" quando ainda não há conta). `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto.
 */
export function StatementListItem({
  condominium,
  balance,
  isOpen = false,
  dimmed = false,
}: {
  condominium: Condominium;
  /** O saldo da conta corrente do condomínio; `null` quando ele ainda não tem conta. */
  balance: number | null;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  return (
    <li>
      <Link
        href={statementUrl(condominium.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">
          <span className="tabular-nums">{String(condominium.code).padStart(4, "0")}</span>
          <span className="text-ink-faint"> · </span>
          {condominium.name}
        </span>
        <span className={cn("block truncate text-caption tabular-nums", balance !== null && balance < 0 ? "text-danger" : "text-ink-soft")}>
          {balance === null ? "Sem lançamentos" : `Saldo ${brl(balance)}`}
        </span>
      </Link>
    </li>
  );
}
