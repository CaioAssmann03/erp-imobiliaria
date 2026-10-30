"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList, useCurrentAccountsList } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { statementUrl } from "@/lib/finance/statement-workspace";
import { cn } from "@/lib/utils";

import { StatementListItem } from "./StatementListItem";

/**
 * Client Component: a coluna da esquerda do extrato, no padrão da lista de condomínios: o título, o seletor de condomínio com caixa de busca (código ou nome; escolher
 * um abre o extrato dele, "Todos os condomínios" volta à tela vazia) e os condomínios por código, 10 de cada vez, cada um com o saldo da conta corrente, e o aberto
 * marcado. Não há **+**: o extrato não se cadastra. A paginação é da API; o seletor lê até 100 condomínios, como as demais listas.
 */
export function StatementList({ openCondominiumId, className }: { openCondominiumId: string | null; className?: string }) {
  const router = useRouter();
  const { limit, showMore } = useGrowingLimit("condominiums");
  const { data: options } = useCondominiumsList({ limit: 100 });
  const { data, isLoading } = useCondominiumsList({ limit }, { query: { placeholderData: keepPreviousData } });
  const { data: accounts } = useCurrentAccountsList({ limit: 100 });
  const balances = new Map((accounts?.results ?? []).map((account) => [account.condominium, Number(account.balance)]));
  const results = data?.results ?? [];

  return (
    <aside
      aria-label="Extrato"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="px-1">
        <h2 className="text-heading">Extrato</h2>
      </div>

      <ScopeSearchCard
        scopes={
          <ScopeSelect
            variant="segment"
            className="flex-1"
            label="Condomínio"
            value={openCondominiumId ?? ""}
            placeholder="Selecione o condomínio"
            allLabel="Todos os condomínios"
            onChange={(condominium) => router.push(statementUrl(condominium || undefined))}
            options={(options?.results ?? []).map((item) => ({ value: item.id, label: `${formatCode(item.code)} · ${item.name}`, title: item.name }))}
          />
        }
      />

      <nav aria-label="Lista de condomínios" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Nenhum condomínio cadastrado ainda.</p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((condominium) => (
              <StatementListItem
                key={condominium.id}
                condominium={condominium}
                balance={balances.get(condominium.id) ?? null}
                isOpen={condominium.id === openCondominiumId}
                dimmed={Boolean(openCondominiumId)}
              />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="condomínio(s)" onMore={showMore} />}
    </aside>
  );
}
