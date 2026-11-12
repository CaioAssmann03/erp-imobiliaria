"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { RegistryCreate } from "@/components/layout/RegistryList";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBlocksList, useUnitsList } from "@/lib/api/generated";
import type { UnitsListPending, UnitsListType } from "@/lib/api/generated/models";
import { newUnitUrl } from "@/lib/condominiums/unit-workspace";

import { UnitListItem } from "./UnitListItem";
import { UnitBlockSelect } from "./UnitBlockSelect";
import { NO_UNIT_FILTERS, unitFilterGroups, type UnitFilters } from "./unit-filter-groups";

/**
 * Client Component: as unidades de um condomínio no padrão visual da lista de condomínios (título com **+**, busca em pílula,
 * linhas simples). Carrega as primeiras ao abrir; busca e filtros (`CompactFilter`: bloco, tipo, situação) são no servidor. O bloco e a
 * pendência já aplicados ao abrir vêm da URL (`?block=`, `?pending=`: de "Ver unidades" nas outras listas). Abrir uma unidade leva ao cadastro dela.
 */
export function UnitsRegistryList({ condominiumId }: { condominiumId: string }) {
  const searchParams = useSearchParams();
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UnitFilters>({
    ...NO_UNIT_FILTERS,
    block: searchParams.get("block") ?? "",
    pending: searchParams.get("pending") ?? "",
  });
  const term = useDebouncedValue(search.trim());
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term);

  const { data: blocksData } = useBlocksList({ condominium: condominiumId, limit: 100 });
  const blocks = blocksData?.results ?? [];
  const blockName = (id: string | null | undefined) => blocks.find((block) => block.id === id)?.name ?? null;

  const { limit, showMore } = useGrowingLimit(`${term}|${filters.block}|${filters.type}|${filters.status}|${filters.pending}`);
  const { data, isLoading, isPlaceholderData } = useUnitsList(
    {
      condominium: condominiumId,
      limit,
      ...(term ? { query: term } : {}),
      ...(filters.block ? { block: filters.block } : {}),
      ...(filters.type ? { type: filters.type as UnitsListType } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.pending ? { pending: filters.pending as UnitsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const filterGroups = unitFilterGroups(filters, (key, value) => setFilters((current) => ({ ...current, [key]: value })));
  // "Limpar" é dos filtros da unidade (tipo, situação, pendência); o bloco é o recorte da lista e fica no seletor acima da busca.
  const clearFilters = () => setFilters((current) => ({ ...NO_UNIT_FILTERS, block: current.block }));

  return (
    <RegistrySubList
      label="Unidades"
      title="Unidades"
      actions={<RegistryCreate href={newUnitUrl(condominiumId)} label="Nova unidade" />}
      above={
        <UnitBlockSelect
          blocks={blocks}
          value={filters.block}
          onChange={(value) => setFilters((current) => ({ ...current, block: value }))}
          onCard
        />
      }
      search={{ label: "Buscar unidade", placeholder: "Nome ou número da unidade", value: search, onChange: setSearch }}
      filter={<CompactFilter groups={filterGroups} onClear={clearFilters} />}
      navLabel="Lista de unidades"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={hasFilters ? "Nenhuma unidade com esses filtros." : "Este condomínio ainda não tem unidades."}
      skeletonRows={8}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="unidade(s)" onMore={showMore} />}
    >
      {results.map((unit) => (
        <UnitListItem key={unit.id} unit={unit} blockName={blockName(unit.block)} onCard context={{ from: here }} />
      ))}
    </RegistrySubList>
  );
}
