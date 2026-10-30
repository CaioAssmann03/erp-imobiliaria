"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow, ScopeDivider } from "@/components/ScopeSearchCard";
import { ScopeSelect } from "@/components/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumPeopleList, useCondominiumsList, usePersonsList, useUnitsList } from "@/lib/api/generated";
import { backTargetOf } from "@/lib/back-target";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { unitListLabel } from "@/lib/unit-workspace";
import { newPersonUrl, originCondominium, type PersonContext } from "@/lib/person-workspace";
import { cn } from "@/lib/utils";

import { PersonListItem } from "./PersonListItem";

/**
 * Client Component: a coluna da esquerda do cadastro de pessoas, no padrão da lista de condomínios: título com **+** de nova pessoa, busca
 * no servidor (nome, CPF/CNPJ, e-mail ou ID) com o filtro discreto dentro (`CompactFilter`, em 2 colunas: situação e tipo, o que é da pessoa)
 * o condomínio como seletor numa linha abaixo do título (a unidade, escolhido o condomínio, é um filtro), e as pessoas, com a aberta marcada. Quem chega de um condomínio (`?condominium=`) ou de uma unidade (`?unit=`) já vê a lista filtrada por
 * ele; `?from=` é a tela de origem, que as pessoas abertas daqui levam adiante para o "voltar".
 */
export function PersonsList({ openPersonId, className }: { openPersonId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", type: "" });
  // O condomínio de onde se chegou (`?condominium=`) já vem como filtro; escolher outro, ou "Todos", vale daí em diante.
  const [picked, setPicked] = useState<string | null>(null);
  const [pickedUnit, setPickedUnit] = useState<string | null>(null);
  const urlParams = useSearchParams();
  const condominium = picked ?? originCondominium(urlParams.get("condominium")) ?? "";
  const unit = pickedUnit ?? originCondominium(urlParams.get("unit")) ?? "";
  const from = backTargetOf(urlParams.get("from"))?.href ?? null;
  const { data: units } = useUnitsList({ condominium, limit: 100 }, { query: { enabled: Boolean(condominium) } });
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${filters.status}|${filters.type}|${condominium}|${unit}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const params = {
    limit,
    person_module: CONDOMINIUMS_MODULE,
    ...(term ? { query: term } : {}),
    ...(filters.status ? { active: filters.status === "active" } : {}),
    ...(filters.type ? { type: filters.type as "individual" | "legal" } : {}),
  };
  // Sem condomínio nem unidade é a lista de pessoas; com eles, a mesma lista só com quem tem vínculo vigente com uma unidade do condomínio ou com a unidade.
  const scoped = Boolean(condominium || unit);
  const everyone = usePersonsList(params, { query: { enabled: !scoped, placeholderData: keepPreviousData } });
  const ofCondominium = useCondominiumPeopleList(
    { ...params, ...(condominium ? { condominium } : {}), ...(unit ? { unit } : {}) },
    { query: { enabled: scoped, placeholderData: keepPreviousData } }
  );
  const { data, isLoading, isPlaceholderData } = scoped ? ofCondominium : everyone;
  const context: PersonContext = { condominium, unit, from };
  const results = data?.results ?? [];
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(term) || scoped;

  const groups: CompactFilterGroup[] = [
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
  // "Limpar" é dos filtros da pessoa (situação e tipo); o condomínio e a unidade são o escopo da lista e ficam na pílula acima da busca.
  const clearFilters = () => setFilters({ status: "", type: "" });

  return (
    <aside
      aria-label="Pessoas"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96",
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

      <ScopeSearchCard
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={condominium}
              allLabel="Todos os condomínios"
              onChange={(value) => {
                setPicked(value);
                setPickedUnit("");
              }}
              options={(condominiums?.results ?? []).map((item) => ({
                value: item.id,
                label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
                title: item.name,
              }))}
            />
            {condominium && (
              <>
                <ScopeDivider />
                <ScopeSelect
                  variant="segment"
                  className="max-w-[45%] shrink-0"
                  label="Unidade"
                  value={unit}
                  allLabel="Todas as unidades"
                  onChange={setPickedUnit}
                  options={(units?.results ?? []).map((item) => ({ value: item.id, label: unitListLabel(unitTypeLabel(item.type), item.name) }))}
                />
              </>
            )}
          </>
        }
      >
        <ScopeSearchRow>
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar pessoa por nome, CPF/CNPJ ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou CPF/CNPJ"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          <CompactFilter groups={groups} onClear={clearFilters} columns={2} />
        </ScopeSearchRow>
      </ScopeSearchCard>

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
              <PersonListItem
                key={person.id}
                person={person}
                isOpen={person.id === openPersonId}
                dimmed={Boolean(openPersonId)}
                context={context}
              />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="pessoa(s)" onMore={showMore} />}
    </aside>
  );
}
