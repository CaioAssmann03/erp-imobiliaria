import type { Metadata } from "next";

import { BillingDocumentDetail } from "@/app/(dashboard)/billing/documents/_components/detail/BillingDocumentDetail";
import { DocumentPageHeader } from "@/app/(dashboard)/billing/documents/_components/detail/DocumentPageHeader";

export const metadata: Metadata = { title: "Documento de cobrança" };

export default async function BillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <DocumentPageHeader documentId={id} />
      <BillingDocumentDetail documentId={id} />
    </>
  );
}
