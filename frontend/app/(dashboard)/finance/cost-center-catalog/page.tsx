import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

import { CatalogTable } from "./_components/CatalogTable";

export const metadata: Metadata = { title: "Catálogo de sub-contas" };

export default function CostCenterCatalogPage() {
  return (
    <div>
      <PageHeader
        title="Catálogo de sub-contas"
        description="As sub-contas da administradora, com código e nome uma vez só. Cada condomínio escolhe as que usa; os saldos continuam por condomínio."
        actions={<LinkButton href="/finance/cost-center-catalog/new">Nova sub-conta</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <CatalogTable />
      </Suspense>
    </div>
  );
}
