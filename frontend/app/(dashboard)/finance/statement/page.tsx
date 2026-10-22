import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { StatementTable } from "../_components/StatementTable";
import { PageHeader } from "@/components/PageHeader";
import {
  getCondominiumsListQueryOptions,
  getCurrentAccountEntriesListQueryOptions,
  getCurrentAccountsListQueryOptions,
} from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Extrato" };

export default async function StatementPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string }>;
}) {
  const { condominium } = await searchParams;
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
    ...(condominium
      ? [
          queryClient.prefetchQuery(getCurrentAccountsListQueryOptions({ condominium })),
          queryClient.prefetchQuery(getCurrentAccountEntriesListQueryOptions({ condominium, limit: DEFAULT_PAGE_SIZE })),
        ]
      : []),
  ]);

  return (
    <div>
      <PageHeader title="Extrato" description="Conta corrente de cada condomínio." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StatementTable condominium={condominium} />
      </HydrationBoundary>
    </div>
  );
}
