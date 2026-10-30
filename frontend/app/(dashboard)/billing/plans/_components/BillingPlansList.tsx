"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingPlansList, useCondominiumsList } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { billingPlansUrl, newBillingPlanUrl } from "@/lib/billing/billing-plan-workspace";
import { cn } from "@/lib/utils";

import { BillingPlanListItem } from "./BillingPlanListItem";
import { usePlansScope } from "./use-plans-scope";

/**
 * Client Component: a coluna da esquerda dos planos de cobrança, no padrão da lista de condomínios: título com **+** de novo plano, o condomínio como escopo
 * (seletor; fica na URL, então o plano aberto e o formulário o seguem; "Todos os condomínios" não filtra), a busca no servidor pelo nome com o filtro
 * discreto da situação dentro e os planos, 10 de cada vez, com o aberto marcado.
 */
export function BillingPlansList({ openPlanId, className }: { openPlanId: string | null; className?: string }) {
  const router = useRouter();
  const scope = usePlansScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${term}|${status}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
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
    <aside
      aria-label="Planos de cobrança"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Planos de cobrança</h2>
        <Link
          href={newBillingPlanUrl(scope)}
          aria-label="Novo plano de cobrança"
          title="Novo plano de cobrança"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <ScopeSearchCard
        scopes={
          <ScopeSelect
            variant="segment"
            className="flex-1"
            label="Condomínio"
            value={scope.condominium}
            placeholder="Selecione o condomínio"
            allLabel="Todos os condomínios"
            onChange={(condominium) => router.push(billingPlansUrl({ condominium }))}
            options={(condominiums?.results ?? []).map((item) => ({
              value: item.id,
              label: `${formatCode(item.code)} · ${item.name}`,
              title: item.name,
            }))}
          />
        }
      >
        <ScopeSearchRow>
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar plano pelo nome"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome do plano"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          <CompactFilter groups={groups} onClear={() => setStatus("")} />
        </ScopeSearchRow>
      </ScopeSearchCard>

      <nav aria-label="Lista de planos" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{term || status ? "Nenhum plano com esses filtros." : "Nenhum plano cadastrado ainda."}</p>
        ) : (
          <ul className="space-y-0.5">
            {plans.map((plan) => (
              <BillingPlanListItem key={plan.id} plan={plan} scope={scope} isOpen={plan.id === openPlanId} dimmed={Boolean(openPlanId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={plans.length} total={data.count} noun="plano(s)" onMore={showMore} />}
    </aside>
  );
}
