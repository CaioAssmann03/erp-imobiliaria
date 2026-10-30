import type { Metadata } from "next";

import { CondominiumForm } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumForm";
import { CondominiumHeader } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumHeader";
import { getMapsEmbedKey } from "@/lib/condominiums/maps-embed-key";

export const metadata: Metadata = { title: "Condomínio" };

/** A página de um condomínio: só o que é dele em si (dados e taxa); blocos, unidades e sub-contas abrem em telas próprias, pelo menu da direita. */
export default async function CondominiumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CondominiumHeader condominiumId={id} />
      <CondominiumForm condominiumId={id} mapsEmbedKey={getMapsEmbedKey()} />
    </>
  );
}
