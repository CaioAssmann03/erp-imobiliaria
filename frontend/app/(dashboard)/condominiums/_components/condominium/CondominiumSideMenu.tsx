import { SectionIndex } from "@/components/layout/SectionIndex";
import {
  CONDOMINIUM_PAGES,
  type CondominiumPageKey,
  condominiumPageUrl,
  condominiumUrl,
  REGISTRY_SECTIONS,
} from "@/lib/condominiums/condominium-registry";

/**
 * O menu da direita das telas de um condomínio. Na página dele: as seções do formulário (o que é do condomínio em si, com o marcador que
 * acompanha a rolagem) e, separado, as telas próprias (blocos, unidades, sub-contas). Numa dessas telas: os mesmos dois grupos, com as seções
 * levando de volta à página do condomínio e a tela aberta em destaque em Cadastros.
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

  // Nas telas próprias o menu tem os mesmos títulos da página do condomínio: "Neste condomínio" (as seções, que levam de volta a ela) e "Cadastros".
  return (
    <SectionIndex
      sections={[]}
      label="Menu do condomínio"
      links={[
        { title: "Neste condomínio", items: REGISTRY_SECTIONS.map((section) => ({ href: condominiumUrl(condominiumId, section.id), label: section.label })) },
        { title: "Cadastros", items: pages },
      ]}
    />
  );
}
