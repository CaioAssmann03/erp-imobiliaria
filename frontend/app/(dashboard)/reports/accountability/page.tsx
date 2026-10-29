import type { Metadata } from "next";

import { PageHeader } from "@/components/PageHeader";

import { AccountabilityReportView } from "./_components/AccountabilityReportView";

export const metadata: Metadata = { title: "Prestação de contas" };

export default function AccountabilityReportPage() {
  return (
    <div>
      <PageHeader
        back={{ href: "/reports", label: "Relatórios" }}
        title="Prestação de contas"
        description="O mês de um condomínio na conta corrente: saldo anterior, créditos, débitos e saldo final, por sub-conta."
      />
      <AccountabilityReportView />
    </div>
  );
}
