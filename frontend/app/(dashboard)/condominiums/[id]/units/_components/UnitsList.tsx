"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { FilterMenu } from "@/components/FilterMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBlocksList, useCondominiumsList, useUnitsList } from "@/lib/api/generated";
import type { UnitsListType } from "@/lib/api/generated/models";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/schemas/unit";
import { newUnitUrl, UNIT_LIST_PAGE_SIZE, unitListLabel, unitsUrl, unitUrl } from "@/lib/unit-workspace";
import { cn } from "@/lib/utils";

import { currentLinks } from "./current-links";

/**
 * Client Component: a coluna da esquerda do cadastro de unidades. No alto, o condomínio (código e nome); embaixo, as unidades
 * dele, com busca no servidor, filtros (bloco, tipo, situação) e **Nova**. Sem condomínio escolhido, só pede para escolher.
 * `?block=` na URL (de "Ver unidades" num bloco) já abre filtrada.
 */
export function UnitsList({
  condominiumId,
  openUnitId,
  className,
}: {
  condominiumId: string | null;
  openUnitId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const initialBlock = useSearchParams().get("block") ?? "";
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ block: initialBlock, type: "", status: "" });
  const term = useDebouncedValue(search.trim());

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: blocksData } = useBlocksList(
    { condominium: condominiumId ?? undefined, limit: 100 },
    { query: { enabled: Boolean(condominiumId) } }
  );
  const blocks = blocksData?.results ?? [];
  const blockName = (id: string | null | undefined) => blocks.find((block) => block.id === id)?.name ?? null;

  const { data, isLoading, isPlaceholderData } = useUnitsList(
    {
      condominium: condominiumId ?? undefined,
      limit: UNIT_LIST_PAGE_SIZE,
      ...(term ? { query: term } : {}),
      ...(filters.block ? { block: filters.block } : {}),
      ...(filters.type ? { type: filters.type as UnitsListType } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
    },
    { query: { enabled: Boolean(condominiumId), placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term);

  const chooseCondominium = (id: string) => {
    setFilters({ block: "", type: "", status: "" });
    setSearch("");
    router.push(unitsUrl(id || undefined));
  };

  return (
    <aside
      aria-label="Unidades"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-80",
        className
      )}
    >
      <div className="rounded-card bg-surface p-4 shadow-card">
        <label htmlFor="units-condominium" className="mb-2 block text-heading">
          Condomínio
        </label>
        <select
          id="units-condominium"
          value={condominiumId ?? ""}
          onChange={(event) => chooseCondominium(event.target.value)}
          className="h-9 w-full rounded-control bg-surface-muted px-3 text-body outline-none focus:ring-2 focus:ring-brand/50"
        >
          <option value="">Selecione</option>
          {(condominiums?.results ?? []).map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {String(condominium.code).padStart(4, "0")} · {condominium.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-heading">Unidades</h2>
          {condominiumId ? (
            <Link
              href={newUnitUrl(condominiumId)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-body font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Nova
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-full bg-ink px-3.5 text-body font-medium text-ink-foreground opacity-40"
            >
              <Plus className="size-4" />
              Nova
            </span>
          )}
        </div>

        {condominiumId && (
          <div className="flex items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control bg-surface-muted px-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
              <Search className="size-4 shrink-0" />
              <span className="sr-only">Buscar unidade</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite para pesquisar"
                className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
              />
            </label>
            <FilterMenu
              onClear={() => setFilters({ block: "", type: "", status: "" })}
              groups={[
                ...(blocks.length > 0
                  ? [
                      {
                        key: "block",
                        label: "Bloco",
                        value: filters.block,
                        onChange: (value: string) => setFilters((current) => ({ ...current, block: value })),
                        options: blocks.map((block) => ({ value: block.id, label: block.name })),
                      },
                    ]
                  : []),
                {
                  key: "type",
                  label: "Tipo",
                  value: filters.type,
                  onChange: (value: string) => setFilters((current) => ({ ...current, type: value })),
                  options: UNIT_TYPES,
                },
                {
                  key: "status",
                  label: "Status",
                  value: filters.status,
                  onChange: (value: string) => setFilters((current) => ({ ...current, status: value })),
                  options: [
                    { value: "active", label: "Ativas" },
                    { value: "inactive", label: "Inativas" },
                  ],
                },
              ]}
            />
          </div>
        )}

        <nav
          aria-label="Lista de unidades"
          className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}
        >
          {!condominiumId ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha um condomínio para ver as unidades dele.</p>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-11 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {hasFilters ? "Nenhuma unidade com esses filtros." : "Este condomínio ainda não tem unidades."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((unit) => {
                const isOpen = unit.id === openUnitId;
                const owner = currentLinks(unit).find((link) => link.role === "owner")?.person_detail.name;
                const sub = [blockName(unit.block), owner].filter(Boolean).join(" · ");
                return (
                  <li key={unit.id}>
                    <Link
                      href={unitUrl(unit.condominium, unit.id)}
                      aria-current={isOpen ? "page" : undefined}
                      className={cn(
                        "block rounded-panel px-3 py-2 transition-colors hover:bg-surface-muted",
                        isOpen && "bg-surface-muted shadow-[inset_3px_0_0_var(--color-brand)]",
                        !unit.active && "opacity-60"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-body font-medium">
                          {unitListLabel(unitTypeLabel(unit.type), unit.name)}
                        </span>
                        {unit.is_manager_unit && (
                          <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-caption font-medium text-brand">
                            Síndico
                          </span>
                        )}
                        {!unit.active && (
                          <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-caption text-ink-soft">
                            Inativa
                          </span>
                        )}
                      </span>
                      {sub && <span className="block truncate text-caption text-ink-soft">{sub}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {data && (
          <p className="text-center text-caption text-ink-soft">
            {data.count > results.length
              ? `${results.length} de ${data.count}: refine a busca`
              : `${data.count} unidade(s)`}
          </p>
        )}
      </div>
    </aside>
  );
}
