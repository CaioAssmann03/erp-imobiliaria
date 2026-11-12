"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCostCenterCatalogList } from "@/lib/api/generated";
import { newCatalogItemUrl } from "@/lib/finance/cost-center-catalog-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { RegistrySearch } from "@/components/filters/RegistrySearch";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";

import { CatalogListItem } from "./CatalogListItem";

/**
 * Client Component: a coluna da esquerda do catálogo de sub-contas, no padrão da lista de condomínios: título com **+** de nova sub-conta, busca
 * no servidor (código ou nome) com o filtro discreto dentro (`CompactFilter`: situação) e as sub-contas por código, 10 de cada vez, com a aberta marcada.
 */
export function CatalogList({ openItemId, className }: { openItemId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${status}`);
  const { data, isLoading, isPlaceholderData } = useCostCenterCatalogList(
    { limit, ...(term ? { query: term } : {}), ...(status ? { active: status === "active" } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

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
      label="Catálogo de sub-contas"
      title="Sub-contas"
      actions={<RegistryCreate href={newCatalogItemUrl()} label="Nova sub-conta" />}
      toolbar={
        <ScopeSearchCard>
          <RegistrySearch label="Buscar sub-conta por código ou nome" placeholder="Código ou nome" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={() => setStatus("")} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de sub-contas"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={term || status ? "Nenhuma sub-conta com esses filtros." : "Nenhuma sub-conta no catálogo ainda."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="sub-conta(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((item) => (
        <CatalogListItem key={item.id} item={item} isOpen={item.id === openItemId} dimmed={Boolean(openItemId)} />
      ))}
    </RegistryList>
  );
}
