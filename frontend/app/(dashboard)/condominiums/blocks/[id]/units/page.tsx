import type { Metadata } from "next";

import { BlockHeader } from "@/app/(dashboard)/condominiums/_components/blocks/BlockHeader";
import { BlockUnitsList } from "@/app/(dashboard)/condominiums/_components/blocks/BlockUnitsList";

export const metadata: Metadata = { title: "Unidades do bloco" };

/** As unidades de um bloco, numa sub-tela no meio como as pessoas da unidade; abrir uma leva ao módulo de unidades. */
export default async function BlockUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BlockHeader blockId={id} />
      <BlockUnitsList blockId={id} />
    </>
  );
}
