import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { AccountPayableForm } from "../../_components/AccountPayableForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getAccountsPayableRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Conta a pagar" };

export default async function EditAccountPayablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getAccountsPayableRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/finance/accounts-payable", label: "Contas a pagar" }} title="Conta a pagar" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AccountPayableForm accountId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
