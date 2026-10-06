import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { AccountsPayableTable } from "../_components/AccountsPayableTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { getAccountsPayableListQueryOptions, getCondominiumsListQueryOptions } from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Contas a pagar" };

export default async function AccountsPayablePage() {
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getAccountsPayableListQueryOptions({ limit: DEFAULT_PAGE_SIZE })),
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
  ]);

  return (
    <div>
      <PageHeader
        title="Contas a pagar"
        description="Despesas dos condomínios e da empresa."
        actions={<LinkButton href="/finance/accounts-payable/new">Nova conta a pagar</LinkButton>}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AccountsPayableTable />
      </HydrationBoundary>
    </div>
  );
}
