import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingPlanForm } from "../_components/BillingPlanForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import {
  getBillingPlansRetrieveQueryOptions,
  getCondominiumsListQueryOptions,
  getCostCentersListQueryOptions,
  getEntryTemplatesListQueryOptions,
} from "@/lib/api/generated";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar plano de cobrança" };

export default async function EditBillingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  const [plan] = await Promise.all([
    fetchOrNotFound(queryClient, getBillingPlansRetrieveQueryOptions(id)),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);
  if (plan) {
    // Os seletores de cada item (sub-contas do condomínio e modelos de cada sub-conta) com as chaves do formulário.
    const costCenterIds = [...new Set(plan.items.map((item) => item.cost_center))];
    await Promise.all([
      queryClient.prefetchQuery(getCostCentersListQueryOptions({ condominium: plan.condominium, active: true, limit: 100 })),
      ...costCenterIds.map((costCenter) =>
        queryClient.prefetchQuery(getEntryTemplatesListQueryOptions({ cost_center: costCenter, active: true, limit: 100 }))
      ),
    ]);
  }

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/plans", label: "Planos de cobrança" }} title="Editar plano de cobrança" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingPlanForm billingPlanId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
