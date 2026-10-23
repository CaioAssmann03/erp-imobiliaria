import type { Metadata } from "next";

import { BillingRunsTable } from "./_components/BillingRunsTable";
import { IssueMonthDialog } from "./_components/IssueMonthDialog";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Execuções da emissão" };

export default function BillingRunsPage() {
  return (
    <>
      <PageHeader
        title="Execuções da emissão"
        description="O que cada emissão mensal fez: documentos emitidos, unidades puladas e o motivo."
        actions={<IssueMonthDialog />}
      />
      <BillingRunsTable />
    </>
  );
}
