"use client";

import { useMemo, useState } from "react";

import { ShowMore } from "@/components/data-list";
import { RegistryListItem } from "@/components/layout/RegistryList";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { PersonRowContent } from "@/components/persons/PersonRowContent";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useUnitPeopleList, useUnitsList } from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { personUrl, UNIT_ROLE_LABELS } from "@/lib/persons/person-workspace";

/** Quantos vínculos (e unidades) a tela lê de uma vez: o máximo que a API entrega por página. */
const LINKS_LIMIT = 100;

interface CondominiumPerson {
  person: Person;
  /** "Proprietário · 101, 102" e "Inquilino · 205": o papel e as unidades dele. */
  roles: string[];
}

/**
 * Client Component: as pessoas de um condomínio, as que têm vínculo vigente (proprietário ou inquilino) com alguma unidade dele, na ordem do
 * código, no padrão visual das outras listas do condomínio (cartão branco, busca em pílula, linhas simples). Cada pessoa mostra o papel e as
 * unidades; abrir uma leva à ficha dela. A lista sai dos vínculos vigentes do condomínio (`?condominium=`, `?is_current=` e `?query=`, todos da API), agrupados por pessoa aqui (só a apresentação).
 */
export function CondominiumPeopleList({ condominiumId }: { condominiumId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { data: links, isLoading } = useUnitPeopleList({ condominium: condominiumId, is_current: true, limit: LINKS_LIMIT, ...(term ? { query: term } : {}) });
  const { data: units } = useUnitsList({ condominium: condominiumId, limit: LINKS_LIMIT });

  const people = useMemo<CondominiumPerson[]>(() => {
    const unitName = new Map((units?.results ?? []).map((unit) => [unit.id, unit.name]));
    const byPerson = new Map<string, { person: Person; units: Record<"owner" | "tenant", string[]> }>();
    for (const link of links?.results ?? []) {
      const entry = byPerson.get(link.person) ?? { person: link.person_detail, units: { owner: [], tenant: [] } };
      entry.units[link.role === "owner" ? "owner" : "tenant"].push(unitName.get(link.unit) ?? "—");
      byPerson.set(link.person, entry);
    }
    return [...byPerson.values()]
      .sort((a, b) => a.person.code - b.person.code)
      .map(({ person, units: byRole }) => ({
        person,
        roles: (["owner", "tenant"] as const)
          .filter((role) => byRole[role].length > 0)
          .map((role) => `${UNIT_ROLE_LABELS[role]} · ${byRole[role].join(", ")}`),
      }));
  }, [links, units]);

  const { limit, showMore } = useGrowingLimit(`${term}|${condominiumId}`);
  const results = people.slice(0, limit);

  return (
    <RegistrySubList
      label="Pessoas"
      title="Pessoas"
      search={{ label: "Buscar pessoa", placeholder: "Nome ou CPF/CNPJ", value: search, onChange: setSearch }}
      navLabel="Lista de pessoas do condomínio"
      isLoading={isLoading}
      isEmpty={results.length === 0}
      emptyMessage={term ? "Nenhuma pessoa com essa busca." : "Este condomínio ainda não tem pessoas vinculadas às unidades."}
      footer={
        <>
          {!isLoading && people.length > 0 && <ShowMore shown={results.length} total={people.length} noun="pessoa(s)" onMore={showMore} />}
          {links && links.count > LINKS_LIMIT && (
            <p className="px-1 text-center text-caption text-ink-soft">Mostrando os primeiros {LINKS_LIMIT} vínculos do condomínio.</p>
          )}
        </>
      }
    >
      {results.map(({ person, roles }) => (
        <RegistryListItem key={person.id} href={personUrl(person.id, { condominium: condominiumId, from: here })} onCard>
          <PersonRowContent code={person.code} name={person.name} detail={roles.join("  ·  ")} />
        </RegistryListItem>
      ))}
    </RegistrySubList>
  );
}
