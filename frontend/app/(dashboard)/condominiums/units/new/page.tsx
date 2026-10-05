import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { NewUnitForm } from "../../_components/NewUnitForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Nova unidade" };

export default async function NewUnitFromListPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 }));

  return (
    <FormPage>
      <PageHeader back={{ href: "/condominiums/units", label: "Unidades" }} title="Nova unidade" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NewUnitForm />
      </HydrationBoundary>
    </FormPage>
  );
}
