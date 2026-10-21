import type { Metadata } from "next";
import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { PersonForm } from "../_components/PersonForm";
import { getPersonsRetrieveQueryOptions } from "@/lib/api/generated";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Editar pessoa" };

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personId = id;

  const queryClient = getServerQueryClient();
  await fetchOrNotFound(queryClient, getPersonsRetrieveQueryOptions(personId));
  const person = queryClient.getQueryData(getPersonsRetrieveQueryOptions(personId).queryKey);

  return (
    <FormPage>
      <PageHeader
        back={{ href: "/persons", label: "Pessoas" }}
        title="Editar pessoa"
        description={person ? `ID ${person.code}` : undefined}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PersonForm personId={personId} />
      </HydrationBoundary>
    </FormPage>
  );
}
