"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumPeopleList, usePersonsList, useUnitsList } from "@/lib/api/generated";
import { backTargetOf } from "@/lib/navigation/back-target";
import { CONDOMINIUMS_MODULE } from "@/lib/persons/person-module";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { unitListLabel } from "@/lib/condominiums/unit-workspace";
import { newPersonUrl, originCondominium, type PersonContext } from "@/lib/persons/person-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

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
    <RegistryList
      label="Pessoas"
      title="Pessoas"
      actions={<RegistryCreate href={newPersonUrl()} label="Nova pessoa" />}
      toolbar={
        <ScopeSearchCard
          scopes={
            <>
              <CondominiumScopeSelect
                value={condominium}
                allLabel="Todos os condomínios"
                onChange={(value) => {
                  setPicked(value);
                  setPickedUnit("");
                }}
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
          <RegistrySearch label="Buscar pessoa por nome, CPF/CNPJ ou e-mail" placeholder="Nome ou CPF/CNPJ" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={clearFilters} columns={2} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de pessoas"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={hasFilters ? "Nenhuma pessoa com esses filtros." : "Nenhuma pessoa cadastrada ainda."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="pessoa(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((person) => (
        <PersonListItem key={person.id} person={person} isOpen={person.id === openPersonId} dimmed={Boolean(openPersonId)} context={context} />
      ))}
    </RegistryList>
  );
}
