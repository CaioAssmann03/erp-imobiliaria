import type { Metadata } from "next";

import { BillingRunView } from "../_components/BillingRunView";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getBillingRunsRetrieveQueryOptions } from "@/lib/api/generated";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Execução da emissão" };

export default async function BillingRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  const run = await fetchOrNotFound(queryClient, getBillingRunsRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/runs", label: "Execuções" }} title="Execução da emissão" />
      <BillingRunView run={run} />
    </FormPage>
  );
}
