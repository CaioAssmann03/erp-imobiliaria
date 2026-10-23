import type { Metadata } from "next";
import { Suspense } from "react";

import { StatementTable } from "../_components/StatementTable";
import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Extrato" };

export default function StatementPage() {
  return (
    <div>
      <PageHeader title="Extrato" description="Conta corrente de cada condomínio." />
      <Suspense fallback={<ListFallback />}>
        <StatementTable />
      </Suspense>
    </div>
  );
}
