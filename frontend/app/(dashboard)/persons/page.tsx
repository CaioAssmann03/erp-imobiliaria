import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { PersonsTable } from "./_components/PersonsTable";
import { getPersonsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Pessoas" };

export default async function PersonsPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(
    getPersonsListQueryOptions({ limit: DEFAULT_PAGE_SIZE, module: CONDOMINIUMS_MODULE })
  );

  return (
    <div>
      <PageHeader
        title="Pessoas"
        description="Proprietários, locatários e demais contatos."
        actions={<LinkButton href="/persons/new">Nova pessoa</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PersonsTable />
      </HydrationBoundary>
    </div>
  );
}
