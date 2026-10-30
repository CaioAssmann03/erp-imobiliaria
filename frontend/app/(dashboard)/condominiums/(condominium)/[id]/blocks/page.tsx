import type { Metadata } from "next";
import { Suspense } from "react";

import { BlocksRegistryList } from "@/app/(dashboard)/condominiums/_components/blocks/BlocksRegistryList";
import { CondominiumHeader } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumHeader";
import { ListFallback } from "@/components/data-list";

export const metadata: Metadata = { title: "Blocos" };

/** Os blocos de um condomínio, numa tela própria, na lista no padrão da de condomínios (o menu da direita volta aos dados do condomínio); abrir um leva à edição dele. */
export default async function CondominiumBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <BlocksRegistryList condominiumId={id} />
      </Suspense>
    </>
  );
}
