import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

import { BillingEntriesView } from "./_components/BillingEntriesView";

export const metadata: Metadata = { title: "Inclusão de valores" };

export default function BillingEntriesPage() {
  return (
    <div>
      <PageHeader
        title="Inclusão de valores"
        description="Os valores que entram nos boletos do mês, além do plano de cobrança: taxas extras, água, fundo de obras..."
      />
      <Suspense fallback={<ListFallback />}>
        <BillingEntriesView />
      </Suspense>
    </div>
  );
}
