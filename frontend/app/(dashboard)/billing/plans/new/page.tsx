import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingPlanForm } from "../_components/BillingPlanForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Novo plano de cobrança" };

export default async function NewBillingPlanPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 }));

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/plans", label: "Planos de cobrança" }} title="Novo plano de cobrança" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingPlanForm />
      </HydrationBoundary>
    </FormPage>
  );
}
