import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingPlansTable } from "./_components/BillingPlansTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getBillingPlansListQueryOptions, getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Planos de cobrança" };

export default async function BillingPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string }>;
}) {
  const { condominium } = await searchParams;
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getBillingPlansListQueryOptions({ condominium, limit: DEFAULT_PAGE_SIZE })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  return (
    <div>
      <PageHeader
        title="Planos de cobrança"
        description="O que compõe o boleto mensal de cada unidade do condomínio."
        actions={<LinkButton href="/billing/plans/new">Novo plano</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingPlansTable initialCondominium={condominium} />
      </HydrationBoundary>
    </div>
  );
}
