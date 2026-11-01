"use client";

import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { RegistryListItem } from "@/components/layout/RegistryList";
import { RegistrySubList } from "@/components/layout/RegistrySubList";
import { PersonRowContent } from "@/components/persons/PersonRowContent";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useUnitPeopleList } from "@/lib/api/generated";
import { formatDate } from "@/lib/format/format";
import { personUrl, UNIT_ROLE_LABELS } from "@/lib/persons/person-workspace";

/**
 * Client Component: as pessoas da unidade aberta (o proprietário e o inquilino vigentes), numa sub-tela no meio, como as pessoas do condomínio, no
 * mesmo padrão visual (cartão branco, busca em pílula, linhas simples, 10 de cada vez). Cada linha diz o papel, a participação do proprietário e
 * desde quando; abrir uma leva à ficha da pessoa, cujo "voltar" retorna a esta tela. A busca, os vínculos vigentes e a paginação são da API (`unit-people` com `?unit=`, `?is_current=` e `?query=`).
 */
export function UnitPeopleList({ condominiumId, unitId }: { condominiumId: string; unitId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${unitId}`);
  const { data, isLoading } = useUnitPeopleList({ unit: unitId, is_current: true, limit, ...(term ? { query: term } : {}) });
  const results = data?.results ?? [];

  return (
    <RegistrySubList
      label="Pessoas da unidade"
      title="Pessoas"
      search={{ label: "Buscar pessoa", placeholder: "Nome", value: search, onChange: setSearch }}
      navLabel="Lista de pessoas da unidade"
      isLoading={isLoading}
      isEmpty={results.length === 0}
      emptyMessage={term ? "Nenhuma pessoa com essa busca." : "Esta unidade ainda não tem proprietário nem inquilino vigente."}
      skeletonRows={3}
      footer={!isLoading && data && data.count > 0 && <ShowMore shown={results.length} total={data.count} noun="pessoa(s)" onMore={showMore} />}
    >
      {results.map((link) => {
        const role = UNIT_ROLE_LABELS[link.role === "owner" ? "owner" : "tenant"];
        const detail = [
          role,
          link.role === "owner" && link.ownership_percentage ? `${Number(link.ownership_percentage)}%` : null,
          `desde ${formatDate(link.start_date)}`,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <RegistryListItem key={link.id} href={personUrl(link.person, { condominium: condominiumId, unit: unitId, from: here })} onCard>
            <PersonRowContent code={link.person_detail.code} name={link.person_detail.name} detail={detail} />
          </RegistryListItem>
        );
      })}
    </RegistrySubList>
  );
}
