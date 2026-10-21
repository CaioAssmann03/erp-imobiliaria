import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { BillingDocumentView } from "../_components/BillingDocumentView";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getBillingDocumentsRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Documento de cobrança" };

export default async function BillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getBillingDocumentsRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/documents", label: "Documentos" }} title="Documento de cobrança" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillingDocumentView documentId={id} />
      </HydrationBoundary>
    </FormPage>
  );
}
