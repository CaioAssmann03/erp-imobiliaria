import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumHeader } from "../../_components/CondominiumHeader";
import { CondominiumSideMenu } from "../../_components/CondominiumSideMenu";
import { CostCentersRegistryList } from "../../_components/CostCentersRegistryList";
import { ListFallback } from "@/components/data-list";
import { FormPage } from "@/components/form/FormPage";

export const metadata: Metadata = { title: "Sub-contas" };

/** As sub-contas de um condomínio, numa tela própria, na lista no padrão da de condomínios (o menu da direita volta aos dados do condomínio); abrir uma leva à edição dela. */
export default async function CondominiumCostCentersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage aside={<CondominiumSideMenu condominiumId={id} current="cost-centers" />}>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <CostCentersRegistryList condominiumId={id} />
      </Suspense>
    </FormPage>
  );
}
