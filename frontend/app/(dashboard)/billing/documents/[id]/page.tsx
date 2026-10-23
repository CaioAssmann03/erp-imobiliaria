import type { Metadata } from "next";

import { BillingDocumentDetail } from "../_components/BillingDocumentDetail";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Documento de cobrança" };

export default async function BillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/billing/documents", label: "Documentos" }} title="Documento de cobrança" />
      <BillingDocumentDetail documentId={id} />
    </FormPage>
  );
}
