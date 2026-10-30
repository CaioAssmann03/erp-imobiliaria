import type { Metadata } from "next";

import { BillingDocumentDetail } from "@/app/(dashboard)/billing/documents/_components/detail/BillingDocumentDetail";
import { ExtraBillingDocumentHeader } from "../_components/ExtraBillingHeader";

export const metadata: Metadata = { title: "Boleto extra" };

export default async function ExtraBillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <ExtraBillingDocumentHeader documentId={id} />
      <BillingDocumentDetail documentId={id} />
    </>
  );
}
