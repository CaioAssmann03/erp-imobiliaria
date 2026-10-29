import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumHeader } from "../../_components/CondominiumHeader";
import { CondominiumSideMenu } from "../../_components/CondominiumSideMenu";
import { ListFallback } from "@/components/data-list";
import { FormPage } from "@/components/form/FormPage";
import { UnitsRegistryList } from "./_components/UnitsRegistryList";

export const metadata: Metadata = { title: "Unidades" };

/** As unidades de um condomínio, numa tela própria, na lista no padrão da de condomínios (`?block=` filtra); abrir uma leva ao cadastro de unidades. */
export default async function CondominiumUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} current="units" />}>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <UnitsRegistryList condominiumId={id} />
      </Suspense>
    </FormPage>
  );
}
