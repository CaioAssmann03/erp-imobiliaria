"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useUnitsList } from "@/lib/api/generated";

import { UnitListItem } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/UnitListItem";

/**
 * Client Component: as unidades do bloco aberto, numa sub-tela no meio (como as pessoas da unidade), no padrão visual das outras listas do
 * condomínio: cartão branco, busca em pílula (no servidor), linhas simples, 10 de cada vez. Abrir uma unidade leva ao módulo de unidades, e o
 * "voltar" dela retorna a esta tela (`?from=`).
 */
export function BlockUnitsList({ blockId }: { blockId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${blockId}`);
  const { data, isLoading, isPlaceholderData } = useUnitsList(
    { block: blockId, limit, ...(term ? { query: term } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

  return (
    <RegistrySubList
      label="Unidades do bloco"
      title="Unidades"
      search={{ label: "Buscar unidade", placeholder: "Nome ou número da unidade", value: search, onChange: setSearch }}
      navLabel="Lista de unidades do bloco"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={term ? "Nenhuma unidade com essa busca." : "Este bloco ainda não tem unidades."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="unidade(s)" onMore={showMore} />}
    >
      {results.map((unit) => (
        <UnitListItem key={unit.id} unit={unit} blockName={null} onCard context={{ block: blockId, from: here }} />
      ))}
    </RegistrySubList>
  );
}
