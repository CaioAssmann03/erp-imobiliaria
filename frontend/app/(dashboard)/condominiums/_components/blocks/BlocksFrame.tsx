"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { FormPage } from "@/components/form/FormPage";
import { useBlocksRetrieve } from "@/lib/api/generated";
import { blocksFrameState } from "@/lib/condominiums/block-workspace";
import { BlockSideMenu } from "./BlockSideMenu";
import { BlocksList } from "./BlocksList";
import { CondominiumSideMenu } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumSideMenu";

/**
 * Client Component: a moldura do cadastro e da edição de um bloco (os blocos do condomínio à esquerda, o formulário ao lado). Só envolve
 * essas duas telas (`blocksFrameState`); as demais passam direto. Na edição o condomínio vem do próprio bloco (a mesma consulta que o
 * formulário faz). No celular só o formulário aparece.
 */
export function BlocksFrame({ children }: { children: React.ReactNode }) {
  const state = blocksFrameState(usePathname());
  const { data: block } = useBlocksRetrieve(state.blockId ?? "", { query: { enabled: Boolean(state.blockId) } });
  if (!state.hasFrame) return <>{children}</>;

  // O menu da direita é desta moldura (layout): o do bloco na edição, o do condomínio (com Blocos aberto) no cadastro.
  const aside = state.blockId ? <BlockSideMenu blockId={state.blockId} current={state.subScreen} /> : state.condominiumId ? <CondominiumSideMenu condominiumId={state.condominiumId} current="blocks" /> : null;

  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      <Suspense fallback={null}>
        <BlocksList condominiumId={state.condominiumId ?? block?.condominium ?? null} openBlockId={state.blockId} className="hidden lg:flex" />
      </Suspense>
      <div className="min-w-0 flex-1">{aside ? <FormPage aside={aside}>{children}</FormPage> : children}</div>
    </div>
  );
}
