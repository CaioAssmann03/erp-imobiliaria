import { SectionIndex } from "@/components/SectionIndex";
import {
  CONDOMINIUM_PAGES,
  type CondominiumPageKey,
  condominiumPageUrl,
  condominiumUrl,
  REGISTRY_SECTIONS,
} from "@/lib/condominium-registry";

/**
 * O menu da direita das telas de um condomínio. Na página dele: as seções do formulário (o que é do condomínio em si, com o marcador que
 * acompanha a rolagem) e, separado, as telas próprias (blocos, unidades, sub-contas). Numa dessas telas: o caminho de volta aos dados do
 * condomínio e as telas próprias, com a aberta em destaque.
 */
export function CondominiumSideMenu({ condominiumId, current }: { condominiumId: string; current?: CondominiumPageKey }) {
  const pages = CONDOMINIUM_PAGES.map((page) => ({
    href: condominiumPageUrl(condominiumId, page.key),
    label: page.label,
    current: page.key === current,
  }));

  if (!current) {
    return (
      <SectionIndex
        sections={REGISTRY_SECTIONS}
        label="Menu do condomínio"
        title="Neste condomínio"
        links={{ title: "Cadastros", items: pages }}
      />
    );
  }

  return (
    <SectionIndex
      sections={[]}
      label="Menu do condomínio"
      links={{ title: "Neste condomínio", items: [{ href: condominiumUrl(condominiumId), label: "Dados e taxa" }, ...pages] }}
    />
  );
}
