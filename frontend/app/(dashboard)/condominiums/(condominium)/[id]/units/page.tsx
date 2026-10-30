import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumHeader } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumHeader";
import { ListFallback } from "@/components/data-list";
import { UnitsRegistryList } from "./_components/UnitsRegistryList";

export const metadata: Metadata = { title: "Unidades" };

/** As unidades de um condomínio, numa tela própria, na lista no padrão da de condomínios (`?block=` filtra); abrir uma leva ao cadastro de unidades. */
export default async function CondominiumUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <UnitsRegistryList condominiumId={id} />
      </Suspense>
    </>
  );
}
