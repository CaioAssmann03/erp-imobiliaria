import type { Metadata } from "next";

import { PageHeader } from "@/components/PageHeader";

import { UnitSheetReportView } from "./_components/UnitSheetReportView";

export const metadata: Metadata = { title: "Ficha da unidade" };

export default function UnitSheetReportPage() {
  return (
    <div>
      <PageHeader
        back={{ href: "/reports", label: "Relatórios" }}
        title="Ficha da unidade"
        description="Tudo de uma unidade em uma página: dados, pessoas, boletos e lançamentos do extrato."
      />
      <UnitSheetReportView />
    </div>
  );
}
