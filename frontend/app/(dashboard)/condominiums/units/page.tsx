import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { UnitsTable } from "../[id]/units/_components/UnitsTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import {
  getBlocksListQueryOptions,
  getCondominiumsListQueryOptions,
  getUnitsListQueryOptions,
} from "@/lib/api/generated";
import type { UnitsListPending } from "@/lib/api/generated/models";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Unidades" };

export default async function AllUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string; block?: string; pending?: string }>;
}) {
  const { condominium, block, pending } = await searchParams;
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getUnitsListQueryOptions({
      condominium,
      block,
      limit: DEFAULT_PAGE_SIZE,
      ...(pending ? { pending: pending as UnitsListPending } : {}),
    })),
    queryClient.prefetchQuery(getBlocksListQueryOptions({ condominium, limit: 100 })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Unidades de todos os condomínios administrados."
        actions={<LinkButton href="/condominiums/units/new">Nova unidade</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UnitsTable initialCondominium={condominium} initialBlock={block} initialPending={pending} />
      </HydrationBoundary>
    </div>
  );
}
