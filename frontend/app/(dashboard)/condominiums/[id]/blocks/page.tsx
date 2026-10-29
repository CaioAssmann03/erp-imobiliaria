import type { Metadata } from "next";
import { Suspense } from "react";

import { BlocksTable } from "../../_components/BlocksTable";
import { SectionActions } from "../../_components/workspace/SectionActions";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";

export const metadata: Metadata = { title: "Blocos" };

export default async function CondominiumBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <SectionActions>
        <LinkButton href={`/condominiums/${id}/blocks/new`} size="sm">
          Novo bloco
        </LinkButton>
      </SectionActions>
      <Suspense fallback={<ListFallback />}>
        <BlocksTable condominiumId={id} />
      </Suspense>
    </>
  );
}
