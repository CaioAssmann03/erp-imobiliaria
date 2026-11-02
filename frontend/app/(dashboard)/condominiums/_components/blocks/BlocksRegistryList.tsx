"use client";

import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { RegistryCreate } from "@/components/layout/RegistryList";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBlocksList } from "@/lib/api/generated";
import { newBlockUrl } from "@/lib/condominiums/block-workspace";

import { BlockListItem } from "./BlockListItem";

/**
 * Client Component: os blocos de um condomínio no padrão visual da lista de condomínios (título com **+**, busca em pílula, linhas simples
 * num cartão branco). A busca pelo nome e a paginação são da API.
 * Abrir um bloco leva à edição dele.
 */
export function BlocksRegistryList({ condominiumId }: { condominiumId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${condominiumId}`);
  const { data, isLoading } = useBlocksList({ condominium: condominiumId, limit, ...(term ? { query: term } : {}) });
  const results = data?.results ?? [];

  return (
    <RegistrySubList
      label="Blocos"
      title="Blocos"
      actions={<RegistryCreate href={newBlockUrl(condominiumId)} label="Novo bloco" />}
      search={{ label: "Buscar bloco", placeholder: "Nome do bloco", value: search, onChange: setSearch }}
      navLabel="Lista de blocos"
      isLoading={isLoading}
      isEmpty={results.length === 0}
      emptyMessage={term ? "Nenhum bloco com esse nome." : "Este condomínio ainda não tem blocos."}
      skeletonClassName="h-11"
      footer={data && <ShowMore shown={results.length} total={data.count} noun="bloco(s)" onMore={showMore} />}
    >
      {results.map((block) => (
        <BlockListItem key={block.id} block={block} onCard withUnitsLink from={here} />
      ))}
    </RegistrySubList>
  );
}
