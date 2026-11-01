"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { RegistryFrame } from "@/components/layout/RegistryFrame";
import { useBlocksRetrieve } from "@/lib/api/generated";
import { blocksFrameState } from "@/lib/condominiums/block-workspace";
import { CondominiumSideMenu } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumSideMenu";

import { BlockSideMenu } from "./BlockSideMenu";
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

  // O menu da direita é desta moldura (layout): o do bloco na edição, o do condomínio (com Blocos aberto) no cadastro.
  const aside = state.blockId ? <BlockSideMenu blockId={state.blockId} current={state.subScreen} /> : state.condominiumId ? <CondominiumSideMenu condominiumId={state.condominiumId} current="blocks" /> : undefined;

  return (
    <RegistryFrame
      list={(className) => (
        <Suspense fallback={null}>
          <BlocksList condominiumId={state.condominiumId ?? block?.condominium ?? null} openBlockId={state.blockId} className={className} />
        </Suspense>
      )}
      aside={aside}
      showListOnPhone={false}
    >
      {children}
    </RegistryFrame>
  );
}
