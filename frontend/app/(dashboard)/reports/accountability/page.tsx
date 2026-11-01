import type { Metadata } from "next";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";

import { AccountabilityReportView } from "./_components/AccountabilityReportView";

export const metadata: Metadata = { title: "Prestação de contas" };

export default function AccountabilityReportPage() {
  return (
    <div>
      <PageHeader
        backSlot={
          <PhoneBackLink href="/reports" label="Relatórios" />
        }
        title="Prestação de contas"
        description="O mês de um condomínio na conta corrente: saldo anterior, créditos, débitos e saldo final, por sub-conta."
      />
      <AccountabilityReportView />
    </div>
  );
}
