import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CondominiosTable } from "@/components/CondominiosTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiosListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export default async function CondominiosPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getCondominiosListQueryOptions({ limit: DEFAULT_PAGE_SIZE }));

  return (
    <div>
      <PageHeader
        title="Condomínios"
        description="Cadastro e gestão dos condomínios administrados."
        actions={<LinkButton href="/condominios/novo">Novo condomínio</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CondominiosTable />
      </HydrationBoundary>
    </div>
  );
}
