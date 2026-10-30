"use client";

import { SectionIndex } from "@/components/SectionIndex";
import { useUnitsRetrieve } from "@/lib/api/generated";
import { personUrl, UNIT_ROLE_LABELS } from "@/lib/person-workspace";
import { UNIT_SECTIONS } from "@/lib/unit-workspace";

import { currentLinks } from "./current-links";

/**
 * O menu da direita da unidade aberta: as seções da página e, embaixo, **Pessoas**: o proprietário e o inquilino vigentes dela, cada um um link
 * para a ficha da pessoa. Lê a unidade pela mesma consulta do formulário (uma só chamada); sem vínculos, só as seções.
 */
export function UnitSideMenu({ unitId }: { unitId: string }) {
  const { data: unit } = useUnitsRetrieve(unitId);
  const people = unit
    ? currentLinks(unit).map((link) => ({
        href: personUrl(link.person),
        label: `${link.person_detail.name} · ${UNIT_ROLE_LABELS[link.role === "owner" ? "owner" : "tenant"]}`,
      }))
    : [];

  return (
    <SectionIndex
      sections={UNIT_SECTIONS}
      label="Seções da unidade"
      title="Nesta unidade"
      links={people.length > 0 ? { title: "Pessoas", items: people } : undefined}
    />
  );
}
