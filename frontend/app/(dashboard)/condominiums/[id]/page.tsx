import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CondominiumForm } from "../_components/CondominiumForm";
import { PageHeader } from "@/components/PageHeader";
import {
  getCondominiumsRetrieveQueryOptions,
  getCompaniesListQueryOptions,
} from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar condomínio" };

export default async function EditCondominiumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const condominiumId = id;

  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getCondominiumsRetrieveQueryOptions(condominiumId)),
    queryClient.prefetchQuery(getCompaniesListQueryOptions({ limit: 100 })),
  ]);

  return (
    <FormPage>
      <PageHeader
        back={{ href: "/condominiums", label: "Condomínios" }}
        title="Editar condomínio"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CondominiumForm condominiumId={condominiumId} />
      </HydrationBoundary>
    </FormPage>
  );
}
