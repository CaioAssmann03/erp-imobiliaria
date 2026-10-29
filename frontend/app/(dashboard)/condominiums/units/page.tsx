import type { Metadata } from "next";
import { Suspense } from "react";

import { UnitsTable } from "../[id]/units/_components/UnitsTable";
import { UnitsEmptyState } from "../[id]/units/_components/UnitsEmptyState";
import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Unidades" };

/**
 * `/condominiums/units` é o cadastro de unidades: escolhe-se o condomínio na coluna da esquerda (a moldura vem do layout).
 * Com `?pending=` (os atalhos de Pendências do painel) é a tabela de todos os condomínios filtrada pela pendência.
 */
export default async function UnitsPage({ searchParams }: { searchParams: Promise<{ pending?: string }> }) {
  const { pending } = await searchParams;

  if (pending) {
    return (
      <div>
        <PageHeader title="Unidades" description="Unidades de todos os condomínios com a pendência escolhida no painel." />
        <Suspense fallback={<ListFallback />}>
          <UnitsTable />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <UnitsEmptyState />
    </Suspense>
  );
}
