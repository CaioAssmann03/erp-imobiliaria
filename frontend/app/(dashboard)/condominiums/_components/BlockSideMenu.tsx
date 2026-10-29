"use client";

import { SectionIndex } from "@/components/SectionIndex";
import { useBlocksRetrieve } from "@/lib/api/generated";
import { blockUrl } from "@/lib/block-workspace";
import { condominiumPageUrl, condominiumUrl } from "@/lib/condominium-registry";

/**
 * O menu da direita da edição de um bloco: os dados dele, **as unidades do bloco** (a lista de unidades já filtrada por ele) e o caminho de
 * volta aos blocos e ao condomínio. O condomínio vem do próprio bloco (a mesma consulta do formulário); enquanto carrega, só reserva o espaço.
 */
export function BlockSideMenu({ blockId }: { blockId: string }) {
  const { data: block } = useBlocksRetrieve(blockId);
  if (!block) return <div aria-hidden className="hidden w-48 shrink-0 xl:block 2xl:w-56" />;

  return (
    <SectionIndex
      sections={[]}
      label="Menu do bloco"
      links={{
        title: "Neste bloco",
        items: [
          { href: blockUrl(block.id), label: "Dados do bloco", current: true },
          { href: `/condominiums/${block.condominium}/units?block=${block.id}`, label: "Unidades do bloco" },
          { href: condominiumPageUrl(block.condominium, "blocks"), label: "Blocos do condomínio" },
          { href: condominiumUrl(block.condominium), label: "Dados do condomínio" },
        ],
      }}
    />
  );
}
