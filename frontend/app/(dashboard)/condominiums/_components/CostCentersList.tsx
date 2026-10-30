"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow } from "@/components/ScopeSearchCard";
import { ScopeSelect } from "@/components/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { backTargetOf } from "@/lib/back-target";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList, useCostCentersList } from "@/lib/api/generated";
import { newCostCenterUrl } from "@/lib/cost-center-workspace";
import { cn } from "@/lib/utils";

import { CostCenterListItem } from "./CostCenterListItem";

/**
 * Client Component: a coluna da esquerda do cadastro e da edição de uma sub-conta, as do condomínio dela no mesmo padrão da lista de
 * condomínios, com a aberta marcada. O condomínio é um seletor acima da busca, como na coluna de unidades (troca a lista e o **+**
 * sem sair da tela) e a situação; o condomínio da lista se lê numa linha abaixo. Sem `condominiumId` (a edição ainda carregando a
 * sub-conta) mostra só o esqueleto.
 */
export function CostCentersList({
  condominiumId,
  openCostCenterId,
  className,
}: {
  condominiumId: string | null;
  openCostCenterId: string | null;
  className?: string;
}) {
  // A origem com que a sub-conta foi aberta segue ao trocar de sub-conta pela lista: o "voltar" continua levando a ela.
  const from = backTargetOf(useSearchParams().get("from"))?.href ?? null;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const activeCondominium = chosen ?? condominiumId;
  const term = useDebouncedValue(search.trim());

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { limit, showMore } = useGrowingLimit(`${term}|${activeCondominium}|${status}`);
  const { data, isLoading, isPlaceholderData } = useCostCentersList(
    {
      condominium: activeCondominium ?? undefined,
      limit,
      ...(term ? { query: term } : {}),
      ...(status ? { active: status === "active" } : {}),
    },
    { query: { enabled: Boolean(activeCondominium), placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const loading = !activeCondominium || isLoading;

  const groups: CompactFilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: status,
      onChange: setStatus,
      options: [
        { value: "active", label: "Ativas" },
        { value: "inactive", label: "Inativas" },
      ],
    },
  ];

  return (
    <aside
      aria-label="Sub-contas"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Sub-contas</h2>
        {activeCondominium ? (
          <Link
            href={newCostCenterUrl(activeCondominium)}
            aria-label="Nova sub-conta"
            title="Nova sub-conta"
            className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
          </Link>
        ) : (
          <span aria-disabled="true" className="flex size-8 items-center justify-center text-ink-soft opacity-40">
            <Plus className="size-5" />
          </span>
        )}
      </div>

      <ScopeSearchCard
        scopes={
          <ScopeSelect
            variant="segment"
            className="flex-1"
            label="Condomínio"
            value={activeCondominium ?? ""}
            placeholder="Selecione o condomínio"
            onChange={(value) => {
              setChosen(value || null);
              setSearch("");
              setStatus("");
            }}
            options={(condominiums?.results ?? []).map((condominium) => ({
              value: condominium.id,
              label: `${String(condominium.code).padStart(4, "0")} · ${condominium.name}`,
              title: condominium.name,
            }))}
          />
        }
      >
        <ScopeSearchRow>
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar sub-conta"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código ou nome"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          <CompactFilter groups={groups} onClear={() => setStatus("")} />
        </ScopeSearchRow>
      </ScopeSearchCard>

      <nav
        aria-label="Lista de sub-contas"
        className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}
      >
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {term || status ? "Nenhuma sub-conta com esses filtros." : "Este condomínio ainda não tem sub-contas."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((costCenter) => (
              <CostCenterListItem
                key={costCenter.id}
                costCenter={costCenter}
                isOpen={costCenter.id === openCostCenterId}
                dimmed={results.some((item) => item.id === openCostCenterId)}
                from={from}
              />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="sub-conta(s)" onMore={showMore} />}
    </aside>
  );
}
