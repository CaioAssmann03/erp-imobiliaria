"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { ShowMore } from "@/components/data-list";
import { RegistryCreate } from "@/components/layout/RegistryList";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCostCentersList } from "@/lib/api/generated";
import { newCostCenterUrl } from "@/lib/condominiums/cost-center-workspace";

import { CostCenterListItem } from "./CostCenterListItem";

/**
 * Client Component: as sub-contas de um condomínio no padrão visual da lista de condomínios (título com **+**, busca em pílula com o filtro
 * discreto dentro, linhas simples num cartão branco, a situação em texto verde ou preto). Carrega as primeiras ao abrir; busca por nome e
 * filtro de situação são no servidor. Abrir uma sub-conta leva à edição dela.
 */
export function CostCentersRegistryList({ condominiumId }: { condominiumId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${status}`);
  const { data, isLoading, isPlaceholderData } = useCostCentersList(
    {
      condominium: condominiumId,
      limit,
      ...(term ? { query: term } : {}),
      ...(status ? { active: status === "active" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const groups: FilterGroup[] = [
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
    <RegistrySubList
      label="Sub-contas"
      title="Sub-contas"
      actions={<RegistryCreate href={newCostCenterUrl(condominiumId)} label="Nova sub-conta" />}
      search={{ label: "Buscar sub-conta", placeholder: "Código ou nome", value: search, onChange: setSearch }}
      filter={<CompactFilter groups={groups} onClear={() => setStatus("")} />}
      navLabel="Lista de sub-contas"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={term || status ? "Nenhuma sub-conta com esses filtros." : "Este condomínio ainda não tem sub-contas."}
      skeletonClassName="h-11"
      footer={data && <ShowMore shown={results.length} total={data.count} noun="sub-conta(s)" onMore={showMore} />}
    >
      {results.map((costCenter) => (
        <CostCenterListItem key={costCenter.id} costCenter={costCenter} onCard withStatus from={here} />
      ))}
    </RegistrySubList>
  );
}
