"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingPlansList } from "@/lib/api/generated";
import { billingPlansUrl, newBillingPlanUrl } from "@/lib/billing/billing-plan-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

import { BillingPlanListItem } from "./BillingPlanListItem";
import { usePlansScope } from "./use-plans-scope";

/**
 * Client Component: a coluna da esquerda dos planos de cobrança, no padrão da lista de condomínios: título com **+** de novo plano, o condomínio como escopo
 * (seletor; fica na URL, então o plano aberto e o formulário o seguem; "Todos os condomínios" não filtra), a busca no servidor pelo nome com o filtro
 * discreto da situação dentro e os planos, 10 de cada vez, com o aberto marcado.
 */
export function BillingPlansList({ openPlanId, isNew = false, className }: { openPlanId: string | null; /** Num plano novo, escolher outro condomínio aqui mantém o plano novo (e o campo Condomínio do formulário o segue), em vez de ir à tela vazia. */ isNew?: boolean; className?: string }) {
  const router = useRouter();
  const scope = usePlansScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${term}|${status}`);
  const { data, isLoading, isPlaceholderData } = useBillingPlansList(
    {
      limit,
      ...(scope.condominium ? { condominium: scope.condominium } : {}),
      ...(term ? { query: term } : {}),
      ...(status ? { active: status === "active" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const plans = data?.results ?? [];

  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: status,
      onChange: setStatus,
      options: [
        { value: "active", label: "Ativos" },
        { value: "inactive", label: "Inativos" },
      ],
    },
  ];

  return (
    <RegistryList
      label="Planos de cobrança"
      title="Planos de cobrança"
      actions={<RegistryCreate href={newBillingPlanUrl(scope)} label="Novo plano de cobrança" />}
      toolbar={
        <ScopeSearchCard
          scopes={
            <CondominiumScopeSelect
              value={scope.condominium}
              allLabel="Todos os condomínios"
              onChange={(condominium) => router.push(isNew ? newBillingPlanUrl({ condominium }) : billingPlansUrl({ condominium }))}
            />
          }
        >
          <RegistrySearch label="Buscar plano pelo nome" placeholder="Nome do plano" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={() => setStatus("")} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de planos"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={plans.length === 0}
      emptyMessage={term || status ? "Nenhum plano com esses filtros." : "Nenhum plano cadastrado ainda."}
      footer={data && <ShowMore shown={plans.length} total={data.count} noun="plano(s)" onMore={showMore} />}
      className={className}
    >
      {plans.map((plan) => (
        <BillingPlanListItem key={plan.id} plan={plan} scope={scope} isOpen={plan.id === openPlanId} dimmed={Boolean(openPlanId)} />
      ))}
    </RegistryList>
  );
}
