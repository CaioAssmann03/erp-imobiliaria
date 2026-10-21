import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { UnitForm } from "../_components/UnitForm";
import {
  getBlocksListQueryOptions,
  getUnitsRetrieveQueryOptions,
} from "@/lib/api/generated";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar unidade" };

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const condominiumId = id;

  const queryClient = getServerQueryClient();
  await Promise.all([
    fetchOrNotFound(queryClient, getUnitsRetrieveQueryOptions(unitId)),
    queryClient.prefetchQuery(getBlocksListQueryOptions({ condominium: condominiumId, limit: 100 })),
  ]);

  return (
    <FormPage>
      <PageHeader
        back={{ href: `/condominiums/${condominiumId}/units`, label: "Unidades" }}
        title="Editar unidade"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UnitForm condominiumId={condominiumId} unitId={unitId} />
      </HydrationBoundary>
    </FormPage>
  );
}
