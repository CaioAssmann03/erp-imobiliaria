import type { Metadata } from "next";

import { PageHeader } from "@/components/PageHeader";

import { DelinquencyReportView } from "./_components/DelinquencyReportView";

export const metadata: Metadata = { title: "Inadimplência" };

export default function DelinquencyReportPage() {
  return (
    <div>
      <PageHeader
        back={{ href: "/reports", label: "Relatórios" }}
        title="Inadimplência"
        description="Boletos vencidos e ainda não pagos, por condomínio. O valor é o do boleto, sem multa nem juros."
      />
      <DelinquencyReportView />
    </div>
  );
}
