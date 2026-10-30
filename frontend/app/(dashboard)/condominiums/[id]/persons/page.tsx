import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumHeader } from "../../_components/CondominiumHeader";
import { CondominiumPeopleList } from "../../_components/CondominiumPeopleList";
import { CondominiumSideMenu } from "../../_components/CondominiumSideMenu";
import { ListFallback } from "@/components/data-list";
import { FormPage } from "@/components/form/FormPage";

export const metadata: Metadata = { title: "Pessoas do condomínio" };

/** As pessoas de um condomínio (proprietários e inquilinos das unidades dele), numa tela própria como a dos blocos; abrir uma leva à ficha dela. */
export default async function CondominiumPersonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} current="persons" />}>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <CondominiumPeopleList condominiumId={id} />
      </Suspense>
    </FormPage>
  );
}
