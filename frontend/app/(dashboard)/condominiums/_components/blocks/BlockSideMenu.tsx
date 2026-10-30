"use client";

import { useSearchParams } from "next/navigation";

import { SectionIndex } from "@/components/layout/SectionIndex";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { pageKeepingOrigin, withFrom } from "@/lib/navigation/back-target";
import { BLOCK_SECTIONS, blockUnitsUrl, blockUrl } from "@/lib/condominiums/block-workspace";

/**
 * O menu da direita do bloco aberto, que a moldura (`BlocksFrame`) desenha: só os **Dados gerais** e, em **Cadastros**, as **Unidades** do
 * bloco, que abrem uma sub-tela no meio (daí, abrir uma unidade leva ao módulo de unidades). Na sub-tela os mesmos dois títulos, com os dados
 * gerais levando de volta à página do bloco e as Unidades em destaque, como os menus do condomínio e da unidade. Os links levam a pilha do
 * "voltar": a página do bloco abre as unidades com ela como origem, e a sub-tela volta à página do jeito que ela estava.
 */
export function BlockSideMenu({ blockId, current }: { blockId: string; current?: "units" | null }) {
  const here = useCurrentUrl();
  const fromParam = useSearchParams().get("from");

  if (current) {
    return (
      <SectionIndex
        sections={[]}
        label="Menu do bloco"
        links={[
          {
            title: "Neste bloco",
            items: BLOCK_SECTIONS.map((section) => ({ href: `${pageKeepingOrigin(blockUrl(blockId), fromParam)}#${section.id}`, label: section.label })),
          },
          { title: "Cadastros", items: [{ href: here, label: "Unidades", current: true }] },
        ]}
      />
    );
  }

  return (
    <SectionIndex
      sections={BLOCK_SECTIONS}
      label="Seções do bloco"
      title="Neste bloco"
      links={{ title: "Cadastros", items: [{ href: withFrom(blockUnitsUrl(blockId), here), label: "Unidades" }] }}
    />
  );
}
