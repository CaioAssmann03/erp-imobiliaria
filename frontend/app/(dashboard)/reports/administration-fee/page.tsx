import type { Metadata } from "next";

import { PageHeader } from "@/components/PageHeader";

import { AdministrationFeeReportView } from "./_components/AdministrationFeeReportView";

export const metadata: Metadata = { title: "Taxa de administração" };

export default function AdministrationFeeReportPage() {
  return (
    <div>
      <PageHeader
        back={{ href: "/reports", label: "Relatórios" }}
        title="Taxa de administração"
        description="O que a administradora tem a cobrar de cada condomínio no mês, pelo contrato e pelo extrato."
      />
      <AdministrationFeeReportView />
    </div>
  );
}
