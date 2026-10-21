import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BlockForm } from "../../_components/BlockForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Novo bloco" };

export default async function NewBlockPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 }));

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/blocks", label: "Blocos" }} title="Novo bloco" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BlockForm />
      </HydrationBoundary>
    </FormPage>
  );
}
