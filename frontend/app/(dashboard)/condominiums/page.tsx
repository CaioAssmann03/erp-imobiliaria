import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CondominiumsTable } from "./_components/CondominiumsTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import type { CondominiumsListPending } from "@/lib/api/generated/models";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Condomínios" };

export default async function CondominiumsPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const { pending } = await searchParams;
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiumsListQueryOptions({
      limit: DEFAULT_PAGE_SIZE,
      ...(pending ? { pending: pending as CondominiumsListPending } : {}),
    }));

  return (
    <div>
      <PageHeader
        title="Condomínios"
        description="Cadastro e gestão dos condomínios administrados."
        actions={<LinkButton href="/condominiums/new">Novo condomínio</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CondominiumsTable initialPending={pending} />
      </HydrationBoundary>
    </div>
  );
}
