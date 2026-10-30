"use client";

import { useSearchParams } from "next/navigation";

import { SectionIndex } from "@/components/SectionIndex";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useUnitsRetrieve } from "@/lib/api/generated";
import { pageKeepingOrigin, withFrom, withParams } from "@/lib/back-target";
import { uuidParam } from "@/lib/uuid-param";
import { UNIT_SECTIONS, unitPeopleUrl, unitUrl } from "@/lib/unit-workspace";

/**
 * O menu da direita da unidade aberta, que a moldura (`UnitsFrame`) desenha. Na página da unidade: as seções (com o marcador que acompanha a
 * rolagem) e, embaixo, **Cadastros → Pessoas**, que abre a sub-tela das pessoas dela no meio. Nessa sub-tela: os mesmos dois títulos, com as
 * seções levando de volta à página da unidade e **Pessoas** em destaque, como o menu do condomínio. Os links levam a pilha do "voltar": a página
 * abre as pessoas com ela como origem, e a sub-tela volta à página do jeito que ela estava. Lê a unidade pela mesma consulta do formulário.
 */
export function UnitSideMenu({ unitId, current }: { unitId: string; current?: "persons" | null }) {
  const { data: unit } = useUnitsRetrieve(unitId);
  const here = useCurrentUrl();
  const params = useSearchParams();
  const fromParam = params.get("from");
  // O bloco que recorta a lista de unidades segue nos links do menu: trocar de tela da unidade não pode apagá-lo.
  const block = uuidParam(params.get("block"));

  if (current && unit) {
    const page = unitUrl(unit.condominium, unit.id);
    return (
      <SectionIndex
        sections={[]}
        label="Menu da unidade"
        links={[
          { title: "Nesta unidade", items: UNIT_SECTIONS.map((section) => ({ href: `${withParams(pageKeepingOrigin(page, fromParam), { block })}#${section.id}`, label: section.label })) },
          { title: "Cadastros", items: [{ href: here, label: "Pessoas", current: true }] },
        ]}
      />
    );
  }

  return (
    <SectionIndex
      sections={UNIT_SECTIONS}
      label="Seções da unidade"
      title="Nesta unidade"
      links={unit ? { title: "Cadastros", items: [{ href: withParams(withFrom(unitPeopleUrl(unit.condominium, unit.id), here), { block }), label: "Pessoas" }] } : undefined}
    />
  );
}
