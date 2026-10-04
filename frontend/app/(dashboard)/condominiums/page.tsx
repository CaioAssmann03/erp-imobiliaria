import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CondominiumsTable } from "./_components/CondominiumsTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Condomínios" };

export default async function CondominiumsPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: DEFAULT_PAGE_SIZE }));

  return (
    <div>
      <PageHeader
        title="Condomínios"
        description="Cadastro e gestão dos condomínios administrados."
        actions={<LinkButton href="/condominiums/new">Novo condomínio</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CondominiumsTable />
      </HydrationBoundary>
    </div>
  );
}
