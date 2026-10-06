import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CostCenterForm } from "../../_components/CostCenterForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getCostCentersRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar sub-conta" };

export default async function EditCostCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCostCentersRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/cost-centers", label: "Sub-contas" }} title="Editar sub-conta" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CostCenterForm costCenterId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
