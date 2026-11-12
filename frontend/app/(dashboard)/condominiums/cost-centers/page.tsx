import type { Metadata } from "next";
import { Suspense } from "react";

import { CostCentersEmptyState } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCentersEmptyState";

export const metadata: Metadata = { title: "Sub-contas" };

/** `/condominiums/cost-centers` é o cadastro de sub-contas: escolhe-se o condomínio na coluna da esquerda (a moldura vem do layout). `?condominium=` o escolhe de saída. */
export default function CostCentersPage() {
  return (
    <Suspense fallback={null}>
      <CostCentersEmptyState />
    </Suspense>
  );
}
