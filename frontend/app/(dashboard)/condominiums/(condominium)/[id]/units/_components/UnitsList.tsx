"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBlocksList, useCondominiumsList, useUnitsList } from "@/lib/api/generated";
import type { UnitsListPending, UnitsListType } from "@/lib/api/generated/models";
import { newUnitUrl, unitsUrl, withBlockParam } from "@/lib/condominiums/unit-workspace";
import { backTargetOf } from "@/lib/navigation/back-target";
import { uuidParam } from "@/lib/api/uuid-param";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

import { NO_UNIT_FILTERS } from "./unit-filter-groups";
import { UnitListItem } from "./UnitListItem";
import { PENDING_OPTIONS, unitFilterGroups, type UnitFilters } from "./unit-filter-groups";

/**
 * Client Component: a coluna da esquerda do cadastro de unidades. No alto, uma pílula com o condomínio e o bloco lado a lado; embaixo, as
 * unidades dele, com busca no servidor, **+** de nova unidade e filtros discretos (`CompactFilter`: tipo, situação). Sem condomínio
 * escolhido, a pílula pede para escolher. `?block=` na URL (de "Ver unidades" num bloco) já abre filtrada, e `?pending=` (as Pendências do painel) abre a lista de todos os condomínios filtrada pela pendência.
 */
export function UnitsList({
  condominiumId: routeCondominiumId,
  openUnitId,
  isNew = false,
  className,
}: {
  condominiumId: string | null;
  openUnitId: string | null;
  /** Numa unidade nova, escolher outro condomínio aqui leva ao cadastro dele (e não à lista), para a tela e a lista andarem juntas. */
  isNew?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();
  // O bloco de onde se chegou (`?block=`, das unidades de um bloco) já recorta a lista e ela o mantém ao abrir outra unidade; a tela de origem
  // (`?from=`) segue junto, para o "voltar" da unidade continuar levando a ela. Se o endereço traz outro bloco, a lista o acompanha; se um link
  // não traz bloco nenhum (a sub-tela de pessoas, por exemplo), ela **mantém** o que tinha: só o seletor ou outro condomínio o limpam. O campo Bloco
  // do formulário da unidade escreve o endereço com `?block=` (vazio, se ficou sem bloco), e aí a lista o acompanha, inclusive para limpar.
  const rawUrlBlock = urlParams.get("block");
  const urlBlock = uuidParam(rawUrlBlock) ?? "";
  // A pendência do painel (`?pending=`) abre a lista filtrada, de todos os condomínios, e segue nos links das unidades abertas por ela.
  const urlPendingParam = urlParams.get("pending") ?? "";
  const urlPending = PENDING_OPTIONS.some((option) => option.value === urlPendingParam) ? urlPendingParam : "";
  const from = backTargetOf(urlParams.get("from"))?.href ?? null;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UnitFilters>({ ...NO_UNIT_FILTERS, block: urlBlock, pending: urlPending });
  const [seenUrlBlock, setSeenUrlBlock] = useState(rawUrlBlock);
  if (rawUrlBlock !== seenUrlBlock) {
    setSeenUrlBlock(rawUrlBlock);
    if (rawUrlBlock !== null) setFilters((current) => ({ ...current, block: urlBlock }));
  }
  // Outro condomínio na rota (o campo Condomínio do cadastro) traz os blocos dele: o bloco do anterior deixa de valer.
  const [seenCondominium, setSeenCondominium] = useState(routeCondominiumId);
  if (routeCondominiumId !== seenCondominium) {
    setSeenCondominium(routeCondominiumId);
    setFilters((current) => ({ ...current, block: urlBlock }));
  }
  const [seenUrlPending, setSeenUrlPending] = useState(urlPending);
  if (urlPending !== seenUrlPending) {
    setSeenUrlPending(urlPending);
    if (urlPending) setFilters((current) => ({ ...current, pending: urlPending }));
  }
  // Com uma pendência a lista não segue o condomínio da rota: mostra as unidades de todos, ou do que foi escolhido no cartão (`?condominium=`,
  // que os links das unidades levam junto), para não encolher ao abrir uma unidade. Sem pendência vale o condomínio da rota.
  const condominiumId = filters.pending ? uuidParam(urlParams.get("condominium")) : routeCondominiumId;
  const listing = Boolean(condominiumId || filters.pending);
  const term = useDebouncedValue(search.trim());

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: blocksData } = useBlocksList(
    { condominium: condominiumId ?? undefined, limit: 100 },
    { query: { enabled: Boolean(condominiumId) } }
  );
  const blocks = blocksData?.results ?? [];
  const condominiumNameOf = (id: string) => condominiums?.results.find((condominium) => condominium.id === id)?.name ?? null;
  const blockName = (id: string | null | undefined) => blocks.find((block) => block.id === id)?.name ?? null;

  const { limit, showMore } = useGrowingLimit(`${term}|${condominiumId}|${filters.block}|${filters.type}|${filters.status}|${filters.pending}`);
  const { data, isLoading, isPlaceholderData } = useUnitsList(
    {
      condominium: condominiumId ?? undefined,
      limit,
      ...(term ? { query: term } : {}),
      ...(filters.block ? { block: filters.block } : {}),
      ...(filters.type ? { type: filters.type as UnitsListType } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.pending ? { pending: filters.pending as UnitsListPending } : {}),
    },
    { query: { enabled: listing, placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term);
  const filterGroups = unitFilterGroups(filters, (key, value) => setFilters((current) => ({ ...current, [key]: value })));
  // "Limpar" é dos filtros da unidade (tipo e situação); o bloco é o recorte da lista e fica na pílula acima da busca.
  const clearFilters = () => setFilters((current) => ({ ...NO_UNIT_FILTERS, block: current.block }));

  const chooseCondominium = (id: string) => {
    setFilters({ ...NO_UNIT_FILTERS, pending: filters.pending });
    setSearch("");
    if (isNew && id) {
      router.push(newUnitUrl(id));
      return;
    }
    const url = unitsUrl(id || undefined);
    router.push(filters.pending ? `${url}${url.includes("?") ? "&" : "?"}pending=${filters.pending}` : url);
  };

  return (
    <RegistryList
      label="Unidades"
      title="Unidades"
      actions={
        <RegistryCreate
          href={newUnitUrl(condominiumId ?? undefined)}
          label="Nova unidade"
        />
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <>
              <CondominiumScopeSelect value={condominiumId ?? ""} allLabel={filters.pending ? "Todos os condomínios" : undefined} onChange={chooseCondominium} />
              {condominiumId && blocks.length > 0 && (
                <>
                  <ScopeDivider />
                  <ScopeSelect
                    variant="segment"
                    className="max-w-[45%] shrink-0"
                    label="Bloco"
                    value={filters.block}
                    allLabel="Todos os blocos"
                    onChange={(value) => {
                      setFilters((current) => ({ ...current, block: value }));
                      // Numa unidade nova o bloco da lista vai para o campo Bloco do formulário, pelo endereço.
                      if (isNew) router.replace(`${pathname}?${withBlockParam(urlParams.toString(), value)}`);
                    }}
                    options={blocks.map((block) => ({ value: block.id, label: block.name }))}
                  />
                </>
              )}
            </>
          }
        >
          {listing && (
            <RegistrySearch label="Buscar unidade" placeholder="Buscar unidade" value={search} onChange={setSearch}>
              <CompactFilter groups={filterGroups} onClear={clearFilters} />
            </RegistrySearch>
          )}
        </ScopeSearchCard>
      }
      navLabel="Lista de unidades"
      blocked={listing ? null : "Escolha um condomínio para ver as unidades dele."}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={hasFilters ? "Nenhuma unidade com esses filtros." : "Este condomínio ainda não tem unidades."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="unidade(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((unit) => (
        <UnitListItem
          key={unit.id}
          unit={unit}
          blockName={blockName(unit.block)}
          condominiumName={condominiumId ? null : condominiumNameOf(unit.condominium)}
          isOpen={unit.id === openUnitId}
          dimmed={Boolean(openUnitId)}
          context={{ block: filters.block, from, pending: filters.pending, condominium: filters.pending ? condominiumId : null }}
        />
      ))}
    </RegistryList>
  );
}
