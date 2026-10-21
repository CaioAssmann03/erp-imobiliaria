import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingDocumentsTable } from "./_components/BillingDocumentsTable";
import { PageHeader } from "@/components/PageHeader";
import { getBillingDocumentsListQueryOptions, getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Documentos de cobrança" };

export default async function BillingDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ condominium?: string; reference_month?: string }>;
}) {
  const { condominium, reference_month } = await searchParams;
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getBillingDocumentsListQueryOptions({ condominium, reference_month, limit: DEFAULT_PAGE_SIZE })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  return (
    <div>
      <PageHeader title="Documentos de cobrança" description="Os boletos emitidos para cada unidade, mês a mês." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingDocumentsTable initialCondominium={condominium} initialMonth={reference_month} />
      </HydrationBoundary>
    </div>
  );
}
