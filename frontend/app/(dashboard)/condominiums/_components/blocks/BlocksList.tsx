"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { backTargetOf } from "@/lib/navigation/back-target";
import { useBlocksList } from "@/lib/api/generated";
import { newBlockUrl } from "@/lib/condominiums/block-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

import { BlockListItem } from "./BlockListItem";

/**
 * Client Component: a coluna da esquerda do cadastro e da edição de um bloco, a lista dos blocos do condomínio dele no mesmo padrão
 * da lista de condomínios, com o aberto marcado. O condomínio é o seletor numa linha abaixo do título, como na coluna de unidades: trocar leva a lista (e o
 * **+**) para o outro sem sair da tela. Sem `condominiumId` (a edição ainda carregando o bloco) mostra só o esqueleto.
 */
export function BlocksList({
  condominiumId,
  openBlockId,
  className,
}: {
  condominiumId: string | null;
  openBlockId: string | null;
  className?: string;
}) {
  // A origem com que o bloco foi aberto segue ao trocar de bloco pela lista: o "voltar" continua levando a ela.
  const from = backTargetOf(useSearchParams().get("from"))?.href ?? null;
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const activeCondominium = chosen ?? condominiumId;
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${activeCondominium}`);
  const { data, isLoading } = useBlocksList(
    { condominium: activeCondominium ?? undefined, limit, ...(term ? { query: term } : {}) },
    { query: { enabled: Boolean(activeCondominium) } }
  );
  const results = data?.results ?? [];
  const loading = !activeCondominium || isLoading;

  return (
    <RegistryList
      label="Blocos"
      title="Blocos"
      actions={
        <RegistryCreate
          href={activeCondominium ? newBlockUrl(activeCondominium) : undefined}
          label="Novo bloco"
          disabledHint={activeCondominium ? undefined : "Escolha o condomínio para cadastrar um bloco"}
        />
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <CondominiumScopeSelect
              value={activeCondominium ?? ""}
              onChange={(value) => {
                setChosen(value || null);
                setSearch("");
              }}
            />
          }
        >
          <RegistrySearch label="Buscar bloco" placeholder="Nome do bloco" value={search} onChange={setSearch} />
        </ScopeSearchCard>
      }
      navLabel="Lista de blocos"
      isLoading={loading}
      isEmpty={results.length === 0}
      emptyMessage={term ? "Nenhum bloco com esse nome." : "Este condomínio ainda não tem blocos."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="bloco(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((block) => (
        <BlockListItem key={block.id} block={block} isOpen={block.id === openBlockId} dimmed={Boolean(openBlockId)} from={from} />
      ))}
    </RegistryList>
  );
}
