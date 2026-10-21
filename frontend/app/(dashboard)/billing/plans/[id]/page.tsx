import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingPlanForm } from "../_components/BillingPlanForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getBillingPlansRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar plano de cobrança" };

export default async function EditBillingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getBillingPlansRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/plans", label: "Planos de cobrança" }} title="Editar plano de cobrança" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingPlanForm billingPlanId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
