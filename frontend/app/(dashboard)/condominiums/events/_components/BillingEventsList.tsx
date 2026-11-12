"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingEventsList } from "@/lib/api/generated";
import { newEventUrl } from "@/lib/billing/billing-event-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { RegistrySearch } from "@/components/filters/RegistrySearch";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";

import { BillingEventListItem } from "./BillingEventListItem";

/**
 * Client Component: a coluna da esquerda do cadastro de eventos, no padrão da lista de condomínios: título com **+** de novo evento, busca no
 * servidor (código ou nome) com o filtro discreto dentro (`CompactFilter`: situação) e os eventos por código, 10 de cada vez, com o aberto marcado.
 */
export function BillingEventsList({ openEventId, className }: { openEventId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${status}`);
  const { data, isLoading, isPlaceholderData } = useBillingEventsList(
    { limit, ...(term ? { query: term } : {}), ...(status ? { active: status === "active" } : {}) },
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
        { value: "active", label: "Ativos" },
        { value: "inactive", label: "Inativos" },
      ],
    },
  ];

  return (
    <RegistryList
      label="Eventos"
      title="Eventos"
      actions={<RegistryCreate href={newEventUrl()} label="Novo evento" />}
      toolbar={
        <ScopeSearchCard>
          <RegistrySearch label="Buscar evento por código ou nome" placeholder="Código ou nome" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={() => setStatus("")} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de eventos"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={term || status ? "Nenhum evento com esses filtros." : "Nenhum evento cadastrado ainda."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="evento(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((event) => (
        <BillingEventListItem key={event.id} event={event} isOpen={event.id === openEventId} dimmed={Boolean(openEventId)} />
      ))}
    </RegistryList>
  );
}
