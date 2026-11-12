"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { backTargetOf } from "@/lib/navigation/back-target";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCostCentersList } from "@/lib/api/generated";
import { newCostCenterUrl } from "@/lib/condominiums/cost-center-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

import { CostCenterListItem } from "./CostCenterListItem";

/**
 * Client Component: a coluna da esquerda do cadastro e da edição de uma sub-conta, as do condomínio dela no mesmo padrão da lista de
 * condomínios, com a aberta marcada. O condomínio é um seletor acima da busca, como na coluna de unidades (troca a lista e o **+**
 * sem sair da tela) e a situação; o condomínio da lista se lê numa linha abaixo. Sem `condominiumId` (a edição ainda carregando a
 * sub-conta) mostra só o esqueleto; na tela vazia do módulo, sem condomínio escolhido, pede para escolher um.
 */
export function CostCentersList({
  condominiumId,
  openCostCenterId,
  isNew = false,
  className,
}: {
  condominiumId: string | null;
  openCostCenterId: string | null;
  /** Numa sub-conta nova, escolher outro condomínio aqui leva ao cadastro dele, para a tela e a lista andarem juntas. */
  isNew?: boolean;
  className?: string;
}) {
  // A origem com que a sub-conta foi aberta segue ao trocar de sub-conta pela lista: o "voltar" continua levando a ela.
  const router = useRouter();
  const from = backTargetOf(useSearchParams().get("from"))?.href ?? null;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const activeCondominium = chosen ?? condominiumId;
  const term = useDebouncedValue(search.trim());

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
  const needsCondominium = !activeCondominium && !openCostCenterId;
  const loading = activeCondominium ? isLoading : !needsCondominium;

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
    <RegistryList
      label="Sub-contas"
      title="Sub-contas"
      actions={
        <RegistryCreate href={newCostCenterUrl(activeCondominium ?? undefined)} label="Nova sub-conta" />
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <CondominiumScopeSelect
              value={activeCondominium ?? ""}
              onChange={(value) => {
                if (isNew && value) {
                  router.push(newCostCenterUrl(value));
                  return;
                }
                setChosen(value || null);
                setSearch("");
                setStatus("");
              }}
            />
          }
        >
          <RegistrySearch label="Buscar sub-conta" placeholder="Código ou nome" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={() => setStatus("")} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de sub-contas"
      blocked={needsCondominium ? "Escolha o condomínio para ver as sub-contas." : null}
      isLoading={loading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={term || status ? "Nenhuma sub-conta com esses filtros." : "Este condomínio ainda não tem sub-contas."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="sub-conta(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((costCenter) => (
        <CostCenterListItem
          key={costCenter.id}
          costCenter={costCenter}
          isOpen={costCenter.id === openCostCenterId}
          dimmed={results.some((item) => item.id === openCostCenterId)}
          from={from}
        />
      ))}
    </RegistryList>
  );
}
