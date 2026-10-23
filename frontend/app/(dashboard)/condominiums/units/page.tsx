import type { Metadata } from "next";
import { Suspense } from "react";

import { UnitsTable } from "../[id]/units/_components/UnitsTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Unidades" };

export default function AllUnitsPage() {
  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Unidades de todos os condomínios administrados."
        actions={<LinkButton href="/condominiums/units/new">Nova unidade</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <UnitsTable />
      </Suspense>
    </div>
  );
}
