import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumHeader } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumHeader";
import { CostCentersRegistryList } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCentersRegistryList";
import { ListFallback } from "@/components/data-list";

export const metadata: Metadata = { title: "Sub-contas" };

/** As sub-contas de um condomínio, numa tela própria, na lista no padrão da de condomínios (o menu da direita volta aos dados do condomínio); abrir uma leva à edição dela. */
export default async function CondominiumCostCentersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CondominiumHeader condominiumId={id} />
      <Suspense fallback={<ListFallback />}>
        <CostCentersRegistryList condominiumId={id} />
      </Suspense>
    </>
  );
}
