import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BlocksTable } from "../_components/BlocksTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getBlocksListQueryOptions, getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Blocos" };

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string }>;
}) {
  const { condominium } = await searchParams;
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getBlocksListQueryOptions({ condominium, limit: DEFAULT_PAGE_SIZE })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  return (
    <div>
      <PageHeader title="Blocos" description="Blocos de todos os condomínios administrados."
        actions={<LinkButton href="/condominiums/blocks/new">Novo bloco</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BlocksTable initialCondominium={condominium} />
      </HydrationBoundary>
    </div>
  );
}
