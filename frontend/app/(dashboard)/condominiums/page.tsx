import type { Metadata } from "next";
import { Suspense } from "react";

import { CondominiumsTable } from "./_components/CondominiumsTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Condomínios" };

export default function CondominiumsPage() {
  return (
    <div>
      <PageHeader
        title="Condomínios"
        description="Cadastro e gestão dos condomínios administrados."
        actions={<LinkButton href="/condominiums/new">Novo condomínio</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <CondominiumsTable />
      </Suspense>
    </div>
  );
}
