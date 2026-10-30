import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";

import { DelinquencyReportView } from "./_components/DelinquencyReportView";

export const metadata: Metadata = { title: "Inadimplência" };

export default function DelinquencyReportPage() {
  return (
    <div>
      <PageHeader
        backSlot={
          <div className="lg:hidden">
            <BackLink href="/reports" label="Relatórios" />
          </div>
        }
        title="Inadimplência"
        description="Boletos vencidos e ainda não pagos, por condomínio. O valor é o do boleto, sem multa nem juros."
      />
      <DelinquencyReportView />
    </div>
  );
}
