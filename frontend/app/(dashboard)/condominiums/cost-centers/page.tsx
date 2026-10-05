import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CostCentersTable } from "../_components/CostCentersTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions, getCostCentersListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Sub-contas" };

export default async function CostCentersPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string }>;
}) {
  const { condominium } = await searchParams;
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getCostCentersListQueryOptions({ condominium, limit: DEFAULT_PAGE_SIZE })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  return (
    <div>
      <PageHeader
        title="Sub-contas"
        description="Plano de contas de cada condomínio, usado para classificar lançamentos."
        actions={<LinkButton href="/condominiums/cost-centers/new">Nova sub-conta</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CostCentersTable initialCondominium={condominium} />
      </HydrationBoundary>
    </div>
  );
}
