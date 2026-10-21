import type { Metadata } from "next";

import { BillingDocumentView } from "../_components/BillingDocumentView";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { getBillingDocumentsRetrieveQueryOptions } from "@/lib/api/generated";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Documento de cobrança" };

export default async function BillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  const document = await fetchOrNotFound(queryClient, getBillingDocumentsRetrieveQueryOptions(id));

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/documents", label: "Documentos" }} title="Documento de cobrança" />
      <BillingDocumentView document={document} />
    </FormPage>
  );
}
