import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionActions } from "../../_components/workspace/SectionActions";
import { UnitsTable } from "./_components/UnitsTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";

export const metadata: Metadata = { title: "Unidades" };

export default async function CondominiumUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <SectionActions>
        <LinkButton href={`/condominiums/${id}/units/new`} size="sm">
          Nova unidade
        </LinkButton>
      </SectionActions>
      <Suspense fallback={<ListFallback />}>
        <UnitsTable condominiumId={id} />
      </Suspense>
    </>
  );
}
