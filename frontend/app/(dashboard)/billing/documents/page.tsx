import type { Metadata } from "next";
import { Suspense } from "react";

import { BillingDocumentsTable } from "./_components/BillingDocumentsTable";
import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Documentos de cobrança" };

export default function BillingDocumentsPage() {
  return (
    <div>
      <PageHeader title="Documentos de cobrança" description="Os boletos emitidos para cada unidade, mês a mês." />
      <Suspense fallback={<ListFallback />}>
        <BillingDocumentsTable />
      </Suspense>
    </div>
  );
}
