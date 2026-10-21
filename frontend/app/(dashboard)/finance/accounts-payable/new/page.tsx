import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { AccountPayableForm } from "../../_components/AccountPayableForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getCondominiumsListQueryOptions, getSuppliersListQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Nova conta a pagar" };

export default async function NewAccountPayablePage() {
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getCondominiumsListQueryOptions({ limit: 100 })),
    queryClient.prefetchQuery(getSuppliersListQueryOptions({ limit: 100 })),
  ]);

  return (
    <FormPage>
      <PageHeader back={{ href: "/finance/accounts-payable", label: "Contas a pagar" }} title="Nova conta a pagar" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AccountPayableForm />
      </HydrationBoundary>
    </FormPage>
  );
}
