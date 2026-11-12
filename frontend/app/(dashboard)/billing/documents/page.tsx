import type { Metadata } from "next";

import { BillingDocumentsHome } from "./_components/list/BillingDocumentsHome";

export const metadata: Metadata = { title: "Documentos de cobrança" };

export default function BillingDocumentsPage() {
  return <BillingDocumentsHome />;
}
