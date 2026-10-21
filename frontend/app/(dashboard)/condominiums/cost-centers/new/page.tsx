import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CostCenterForm } from "../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default async function NewCostCenterPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 }));

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/cost-centers", label: "Sub-contas" }} title="Nova sub-conta" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CostCenterForm />
      </HydrationBoundary>
    </FormPage>
  );
}
