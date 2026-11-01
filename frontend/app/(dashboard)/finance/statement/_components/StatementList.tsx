"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList, useCurrentAccountsList } from "@/lib/api/generated";
import { statementUrl } from "@/lib/finance/statement-workspace";
import { RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";

import { StatementListItem } from "./StatementListItem";

/**
 * Client Component: a coluna da esquerda do extrato, no padrão da lista de condomínios: o título, o seletor de condomínio com caixa de busca (código ou nome; escolher
 * um abre o extrato dele, "Todos os condomínios" volta à tela vazia) e os condomínios por código, 10 de cada vez, cada um com o saldo da conta corrente, e o aberto
 * marcado. Não há **+**: o extrato não se cadastra. A paginação é da API; o seletor lê até 100 condomínios, como as demais listas.
 */
export function StatementList({ openCondominiumId, className }: { openCondominiumId: string | null; className?: string }) {
  const router = useRouter();
  const { limit, showMore } = useGrowingLimit("condominiums");
  const { data, isLoading } = useCondominiumsList({ limit }, { query: { placeholderData: keepPreviousData } });
  const { data: accounts } = useCurrentAccountsList({ limit: 100 });
  const balances = new Map((accounts?.results ?? []).map((account) => [account.condominium, Number(account.balance)]));
  const results = data?.results ?? [];

  return (
    <RegistryList
      label="Extrato"
      title="Extrato"
      toolbar={
        <ScopeSearchCard
          scopes={
            <CondominiumScopeSelect
              value={openCondominiumId ?? ""}
              allLabel="Todos os condomínios"
              onChange={(condominium) => router.push(statementUrl(condominium || undefined))}
            />
          }
        />
      }
      navLabel="Lista de condomínios"
      isLoading={isLoading}
      isEmpty={results.length === 0}
      emptyMessage="Nenhum condomínio cadastrado ainda."
      footer={data && <ShowMore shown={results.length} total={data.count} noun="condomínio(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((condominium) => (
        <StatementListItem
          key={condominium.id}
          condominium={condominium}
          balance={balances.get(condominium.id) ?? null}
          isOpen={condominium.id === openCondominiumId}
          dimmed={Boolean(openCondominiumId)}
        />
      ))}
    </RegistryList>
  );
}
