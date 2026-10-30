"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow, ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBlocksList, useCondominiumsList, useUnitsList } from "@/lib/api/generated";
import type { UnitsListPending, UnitsListType } from "@/lib/api/generated/models";
import { newUnitUrl, unitsUrl } from "@/lib/condominiums/unit-workspace";
import { cn } from "@/lib/utils";

import { UnitListItem } from "./UnitListItem";
import { backTargetOf } from "@/lib/navigation/back-target";
import { uuidParam } from "@/lib/api/uuid-param";
import { NO_UNIT_FILTERS, PENDING_OPTIONS, unitFilterGroups, type UnitFilters } from "./unit-filter-groups";

/**
 * Client Component: a coluna da esquerda do cadastro de unidades. No alto, uma pílula com o condomínio e o bloco lado a lado; embaixo, as
 * unidades dele, com busca no servidor, **+** de nova unidade e filtros discretos (`CompactFilter`: tipo, situação). Sem condomínio
 * escolhido, a pílula pede para escolher. `?block=` na URL (de "Ver unidades" num bloco) já abre filtrada, e `?pending=` (as Pendências do painel) abre a lista de todos os condomínios filtrada pela pendência.
 */
export function UnitsList({
  condominiumId: routeCondominiumId,
  openUnitId,
  className,
}: {
  condominiumId: string | null;
  openUnitId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const urlParams = useSearchParams();
  // O bloco de onde se chegou (`?block=`, das unidades de um bloco) já recorta a lista e ela o mantém ao abrir outra unidade; a tela de origem
  // (`?from=`) segue junto, para o "voltar" da unidade continuar levando a ela. Se o endereço traz outro bloco, a lista o acompanha; se um link
  // não traz bloco nenhum (a sub-tela de pessoas, por exemplo), ela **mantém** o que tinha: só o seletor ou outro condomínio o limpam.
  const urlBlock = uuidParam(urlParams.get("block")) ?? "";
  // A pendência do painel (`?pending=`) abre a lista filtrada, de todos os condomínios, e segue nos links das unidades abertas por ela.
  const urlPendingParam = urlParams.get("pending") ?? "";
  const urlPending = PENDING_OPTIONS.some((option) => option.value === urlPendingParam) ? urlPendingParam : "";
  const from = backTargetOf(urlParams.get("from"))?.href ?? null;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UnitFilters>({ ...NO_UNIT_FILTERS, block: urlBlock, pending: urlPending });
  const [seenUrlBlock, setSeenUrlBlock] = useState(urlBlock);
  if (urlBlock !== seenUrlBlock) {
    setSeenUrlBlock(urlBlock);
    if (urlBlock) setFilters((current) => ({ ...current, block: urlBlock }));
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
    const url = unitsUrl(id || undefined);
    router.push(filters.pending ? `${url}${url.includes("?") ? "&" : "?"}pending=${filters.pending}` : url);
  };

  return (
    <aside
      aria-label="Unidades"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Unidades</h2>
        {condominiumId ? (
          <Link
            href={newUnitUrl(condominiumId)}
            aria-label="Nova unidade"
            title="Nova unidade"
            className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
          </Link>
        ) : (
          <span aria-disabled="true" className="flex size-8 cursor-not-allowed items-center justify-center text-ink-soft opacity-40">
            <Plus className="size-5" />
          </span>
        )}
      </div>

      <ScopeSearchCard
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={condominiumId ?? ""}
              placeholder="Selecione o condomínio"
              allLabel={filters.pending ? "Todos os condomínios" : undefined}
              onChange={chooseCondominium}
              options={(condominiums?.results ?? []).map((condominium) => ({
                value: condominium.id,
                label: `${String(condominium.code).padStart(4, "0")} · ${condominium.name}`,
                title: condominium.name,
              }))}
            />
            {condominiumId && blocks.length > 0 && (
              <>
                <ScopeDivider />
                <ScopeSelect
                  variant="segment"
                  className="max-w-[45%] shrink-0"
                  label="Bloco"
                  value={filters.block}
                  allLabel="Todos os blocos"
                  onChange={(value) => setFilters((current) => ({ ...current, block: value }))}
                  options={blocks.map((block) => ({ value: block.id, label: block.name }))}
                />
              </>
            )}
          </>
        }
      >
        {listing && (
          <ScopeSearchRow>
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              aria-label="Buscar unidade"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar unidade"
              className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
            />
            <CompactFilter groups={filterGroups} onClear={clearFilters} />
          </ScopeSearchRow>
        )}
      </ScopeSearchCard>

      <nav
        aria-label="Lista de unidades"
        className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}
      >
        {!listing ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha um condomínio para ver as unidades dele.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {hasFilters ? "Nenhuma unidade com esses filtros." : "Este condomínio ainda não tem unidades."}
          </p>
        ) : (
          <ul className="space-y-0.5">
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
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="unidade(s)" onMore={showMore} />}
    </aside>
  );
}
