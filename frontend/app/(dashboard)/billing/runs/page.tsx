import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingRunsTable } from "./_components/BillingRunsTable";
import { IssueMonthDialog } from "./_components/IssueMonthDialog";
import { PageHeader } from "@/components/PageHeader";
import { getBillingRunsListQueryOptions, getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Execuções da emissão" };

export default async function BillingRunsPage() {
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getBillingRunsListQueryOptions({ limit: DEFAULT_PAGE_SIZE })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  // O cabeçalho também fica dentro do boundary: o diálogo "Emitir mês" lê a lista de condomínios.
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHeader
        title="Execuções da emissão"
        description="O que cada emissão mensal fez: documentos emitidos, unidades puladas e o motivo."
        actions={<IssueMonthDialog />}
      />
      <BillingRunsTable />
    </HydrationBoundary>
  );
}
