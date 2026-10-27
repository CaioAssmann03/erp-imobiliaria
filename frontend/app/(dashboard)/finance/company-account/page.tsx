import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

import { CompanyEntriesTable } from "./_components/CompanyEntriesTable";

export const metadata: Metadata = { title: "Conta da imobiliária" };

export default function CompanyAccountPage() {
  return (
    <div>
      <PageHeader
        title="Conta da imobiliária"
        description="O que é da própria imobiliária no sistema, como a tarifa de registro dos boletos pagos. Nunca entra na conta de um condomínio."
      />
      <Suspense fallback={<ListFallback />}>
        <CompanyEntriesTable />
      </Suspense>
    </div>
  );
}
