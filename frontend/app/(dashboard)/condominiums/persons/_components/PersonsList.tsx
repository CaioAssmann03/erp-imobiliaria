"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CompactFilter, FilterSummary } from "@/components/CompactFilter";
import type { FilterGroup } from "@/components/FilterMenu";
import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { usePersonsList } from "@/lib/api/generated";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { newPersonUrl } from "@/lib/person-workspace";
import { cn } from "@/lib/utils";

import { PersonListItem } from "./PersonListItem";

/**
 * Client Component: a coluna da esquerda do cadastro de pessoas, no padrão da lista de condomínios: título com **+** de nova pessoa, busca
 * no servidor (nome, CPF/CNPJ, e-mail ou ID) com o filtro discreto dentro (`CompactFilter`: situação e tipo) e as pessoas, com a aberta marcada.
 */
export function PersonsList({ openPersonId, className }: { openPersonId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", type: "" });
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${filters.status}|${filters.type}`);
  const { data, isLoading, isPlaceholderData } = usePersonsList(
    {
      limit,
      person_module: CONDOMINIUMS_MODULE,
      ...(term ? { query: term } : {}),
      ...(filters.status ? { active: filters.status === "active" } : {}),
      ...(filters.type ? { type: filters.type as "individual" | "legal" } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term);

  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: filters.status,
      onChange: (value) => setFilters((current) => ({ ...current, status: value })),
      options: [
        { value: "active", label: "Ativas" },
        { value: "inactive", label: "Inativas" },
      ],
    },
    {
      key: "type",
      label: "Tipo de pessoa",
      value: filters.type,
      onChange: (value) => setFilters((current) => ({ ...current, type: value })),
      options: [
        { value: "individual", label: "Física" },
        { value: "legal", label: "Jurídica" },
      ],
    },
  ];
  const clearFilters = () => setFilters({ status: "", type: "" });

  return (
    <aside
      aria-label="Pessoas"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-80 2xl:w-96",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Pessoas</h2>
        <Link
          href={newPersonUrl()}
          aria-label="Nova pessoa"
          title="Nova pessoa"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-control bg-surface pr-1.5 pl-3 text-ink-soft shadow-card focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          aria-label="Buscar pessoa por nome, CPF/CNPJ, e-mail ou ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome, CPF/CNPJ ou ID"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
        <CompactFilter groups={groups} onClear={clearFilters} />
      </div>
      <FilterSummary groups={groups} onClear={clearFilters} />

      <nav
        aria-label="Lista de pessoas"
        className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {hasFilters ? "Nenhuma pessoa com esses filtros." : "Nenhuma pessoa cadastrada ainda."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((person) => (
              <PersonListItem key={person.id} person={person} isOpen={person.id === openPersonId} dimmed={Boolean(openPersonId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="pessoa(s)" onMore={showMore} />}
    </aside>
  );
}
