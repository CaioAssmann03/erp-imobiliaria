"use client";

import { usePathname } from "next/navigation";

import { useBlocksRetrieve } from "@/lib/api/generated";
import { blocksFrameState } from "@/lib/block-workspace";
import { BlocksList } from "./BlocksList";

/**
 * Client Component: a moldura do cadastro e da edição de um bloco (os blocos do condomínio à esquerda, o formulário ao lado). Só envolve
 * essas duas telas (`blocksFrameState`); as demais passam direto. Na edição o condomínio vem do próprio bloco (a mesma consulta que o
 * formulário faz). No celular só o formulário aparece.
 */
export function BlocksFrame({ children }: { children: React.ReactNode }) {
  const state = blocksFrameState(usePathname());
  const { data: block } = useBlocksRetrieve(state.blockId ?? "", { query: { enabled: Boolean(state.blockId) } });
  if (!state.hasFrame) return <>{children}</>;

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <BlocksList condominiumId={state.condominiumId ?? block?.condominium ?? null} openBlockId={state.blockId} className="hidden lg:flex" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
