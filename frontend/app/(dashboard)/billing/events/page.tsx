import type { Metadata } from "next";
import { Suspense } from "react";

import { BillingEventsTable } from "./_components/BillingEventsTable";
import { ListFallback } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Eventos" };

export default function BillingEventsPage() {
  return (
    <div>
      <PageHeader
        title="Eventos"
        description="Códigos que preenchem a descrição de um lançamento (ex.: 250 = Limpeza do condomínio)."
        actions={<LinkButton href="/billing/events/new">Novo evento</LinkButton>}
      />
      <Suspense fallback={<ListFallback />}>
        <BillingEventsTable />
      </Suspense>
    </div>
  );
}
