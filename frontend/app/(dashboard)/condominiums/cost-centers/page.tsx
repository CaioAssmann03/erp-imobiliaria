import type { Metadata } from "next";
import { Suspense } from "react";

import { CostCentersTable } from "../_components/CostCentersTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Sub-contas" };

export default function CostCentersPage() {
  return (
    <div>
      <PageHeader
        title="Sub-contas"
        description="Plano de contas de cada condomínio (conta normal, fundo de reserva, obras...), usado para classificar lançamentos."
        actions={<LinkButton href="/condominiums/cost-centers/new">Nova sub-conta</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <CostCentersTable />
      </Suspense>
    </div>
  );
}
