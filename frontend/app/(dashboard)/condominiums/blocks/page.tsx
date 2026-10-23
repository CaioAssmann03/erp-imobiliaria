import type { Metadata } from "next";
import { Suspense } from "react";

import { BlocksTable } from "../_components/BlocksTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Blocos" };

export default function BlocksPage() {
  return (
    <div>
      <PageHeader title="Blocos" description="Blocos de todos os condomínios administrados."
        actions={<LinkButton href="/condominiums/blocks/new">Novo bloco</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <BlocksTable />
      </Suspense>
    </div>
  );
}
