import type { Condominium } from "@/lib/api/generated/models";
import { brl } from "@/lib/format/format";
import { statementUrl } from "@/lib/finance/statement-workspace";
import { cn } from "@/lib/utils";
import { RegistryListItem } from "@/components/layout/RegistryList";

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
    <RegistryListItem href={statementUrl(condominium.id)} isOpen={isOpen} dimmed={dimmed}>
      <span className="block truncate text-body font-medium">
        <span className="tabular-nums">{String(condominium.code).padStart(4, "0")}</span>
        <span className="text-ink-faint"> · </span>
        {condominium.name}
      </span>
      <span className={cn("block truncate text-caption tabular-nums", balance !== null && balance < 0 ? "text-danger" : "text-ink-soft")}>
        {balance === null ? "Sem lançamentos" : `Saldo ${brl(balance)}`}
      </span>
    </RegistryListItem>
  );
}
