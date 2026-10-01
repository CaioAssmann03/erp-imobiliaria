import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { PessoasTable } from "@/components/PessoasTable";
import { getPessoasListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export default async function PessoasPage() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getPessoasListQueryOptions({ limit: DEFAULT_PAGE_SIZE }));

  return (
    <div>
      <PageHeader
        title="Pessoas"
        description="Proprietários, locatários e demais contatos."
        actions={<LinkButton href="/pessoas/novo">Nova pessoa</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PessoasTable />
      </HydrationBoundary>
    </div>
  );
}
