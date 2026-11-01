"use client";

import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { RegistryCreate, RegistryListItem } from "@/components/layout/RegistryList";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { PersonRowContent } from "@/components/persons/PersonRowContent";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumPeopleList } from "@/lib/api/generated";
import type { CondominiumPersonUnitRole } from "@/lib/api/generated/models";
import { newPersonUrl, personUrl, UNIT_ROLE_LABELS } from "@/lib/persons/person-workspace";

/** "Proprietário · 101, 102" e "Inquilino · 205": o papel e as unidades da pessoa. */
const roleText = ({ role, units }: CondominiumPersonUnitRole) => `${UNIT_ROLE_LABELS[role]} · ${units.join(", ")}`;

/**
 * Client Component: as pessoas de um condomínio, as que têm vínculo vigente (proprietário ou inquilino) com alguma unidade dele, na ordem do
 * código, no padrão visual das outras listas do condomínio (cartão branco, busca em pílula, linhas simples). Cada pessoa mostra o papel e as
 * unidades; abrir uma leva à ficha dela. A lista, a busca, a ordem, os papéis com as unidades (`unit_roles`) e a paginação são da API (`condominium-people` com `?condominium=` e `?query=`).
 */
export function CondominiumPeopleList({ condominiumId }: { condominiumId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${condominiumId}`);
  const { data, isLoading } = useCondominiumPeopleList({ condominium: condominiumId, limit, ...(term ? { query: term } : {}) });
  const results = data?.results ?? [];

  return (
    <RegistrySubList
      label="Pessoas"
      title="Pessoas"
      actions={<RegistryCreate href={newPersonUrl({ condominium: condominiumId, from: here })} label="Nova pessoa" />}
      search={{ label: "Buscar pessoa", placeholder: "Nome ou CPF/CNPJ", value: search, onChange: setSearch }}
      navLabel="Lista de pessoas do condomínio"
      isLoading={isLoading}
      isEmpty={results.length === 0}
      emptyMessage={term ? "Nenhuma pessoa com essa busca." : "Este condomínio ainda não tem pessoas vinculadas às unidades."}
      footer={!isLoading && data && data.count > 0 && <ShowMore shown={results.length} total={data.count} noun="pessoa(s)" onMore={showMore} />}
    >
      {results.map((person) => (
        <RegistryListItem key={person.id} href={personUrl(person.id, { condominium: condominiumId, from: here })} onCard>
          <PersonRowContent code={person.code} name={person.name} detail={person.unit_roles.map(roleText).join("  ·  ")} />
        </RegistryListItem>
      ))}
    </RegistrySubList>
  );
}
