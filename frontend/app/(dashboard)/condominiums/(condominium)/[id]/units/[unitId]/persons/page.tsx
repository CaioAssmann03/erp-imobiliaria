import type { Metadata } from "next";
import { Suspense } from "react";

import { UnitHeader } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/UnitHeader";
import { UnitPeopleList } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/UnitPeopleList";

export const metadata: Metadata = { title: "Pessoas da unidade" };

/** As pessoas de uma unidade, numa sub-tela no meio como as pessoas do condomínio; ainda é o módulo de unidades, então o "voltar" sobe ao condomínio, como na página da unidade. */
export default async function UnitPersonsPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = await params;

  return (
    <>
      <Suspense fallback={null}>
        <UnitHeader condominiumId={id} unitId={unitId} />
      </Suspense>
      <UnitPeopleList condominiumId={id} unitId={unitId} />
    </>
  );
}
