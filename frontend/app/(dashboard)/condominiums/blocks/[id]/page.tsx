import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BlockForm } from "../../_components/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getBlocksRetrieveQueryOptions } from "@/lib/api/generated";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar bloco" };

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await fetchOrNotFound(queryClient, getBlocksRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/blocks", label: "Blocos" }} title="Editar bloco" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BlockForm blockId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
