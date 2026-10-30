import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumHeader } from "../../_components/CondominiumHeader";
import { CondominiumPeopleList } from "../../_components/CondominiumPeopleList";
import { ListFallback } from "@/components/data-list";

export const metadata: Metadata = { title: "Pessoas do condomínio" };

/** As pessoas de um condomínio (proprietários e inquilinos das unidades dele), numa tela própria como a dos blocos; abrir uma leva à ficha dela. */
export default async function CondominiumPersonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <CondominiumPeopleList condominiumId={id} />
      </Suspense>
    </>
  );
}
