import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingRunView } from "../_components/BillingRunView";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getBillingRunsRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Execução da emissão" };

export default async function BillingRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getBillingRunsRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/runs", label: "Execuções" }} title="Execução da emissão" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingRunView runId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
