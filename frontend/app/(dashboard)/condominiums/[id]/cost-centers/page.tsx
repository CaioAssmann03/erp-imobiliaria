import type { Metadata } from "next";
import { Suspense } from "react";

import { CostCentersTable } from "../../_components/CostCentersTable";
import { SectionActions } from "../../_components/workspace/SectionActions";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";

export const metadata: Metadata = { title: "Sub-contas" };

export default async function CondominiumCostCentersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <SectionActions>
        <LinkButton href={`/condominiums/${id}/cost-centers/new`} size="sm">
          Nova sub-conta
        </LinkButton>
      </SectionActions>
      <Suspense fallback={<ListFallback />}>
        <CostCentersTable condominiumId={id} />
      </Suspense>
    </>
  );
}
