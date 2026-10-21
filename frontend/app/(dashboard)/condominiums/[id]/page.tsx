import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CondominiumForm } from "../_components/CondominiumForm";
import { PageHeader } from "@/components/PageHeader";
import {
  getCompaniesListQueryOptions,
  getCondominiumsApportionmentQueryOptions,
  getCondominiumsRetrieveQueryOptions,
  getLateInterestRatesListQueryOptions,
} from "@/lib/api/generated";
import { getMapsEmbedKey } from "@/lib/maps-embed-key";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
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
    fetchOrNotFound(queryClient, getCondominiumsRetrieveQueryOptions(condominiumId)),
    queryClient.prefetchQuery(getCompaniesListQueryOptions({ limit: 100 })),
    // As taxas de juros e o rateio aparecem no próprio formulário: com a mesma chave que o cliente usa.
    queryClient.prefetchQuery(getLateInterestRatesListQueryOptions({ condominium: condominiumId, limit: 100 })),
    queryClient.prefetchQuery(getCondominiumsApportionmentQueryOptions(condominiumId)),
  ]);
  const condominium = queryClient.getQueryData(
    getCondominiumsRetrieveQueryOptions(condominiumId).queryKey
  );

  return (
    <FormPage>
      <PageHeader
        back={{ href: "/condominiums", label: "Condomínios" }}
        title="Editar condomínio"
        description={condominium ? `ID ${condominium.code}` : undefined}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CondominiumForm condominiumId={condominiumId} mapsEmbedKey={getMapsEmbedKey()} />
      </HydrationBoundary>
    </FormPage>
  );
}
