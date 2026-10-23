import type { Metadata } from "next";
import { Suspense } from "react";

import { BillingPlansTable } from "./_components/BillingPlansTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Planos de cobrança" };

export default function BillingPlansPage() {
  return (
    <div>
      <PageHeader
        title="Planos de cobrança"
        description="O que compõe o boleto mensal de cada unidade do condomínio."
        actions={<LinkButton href="/billing/plans/new">Novo plano</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <BillingPlansTable />
      </Suspense>
    </div>
  );
}
