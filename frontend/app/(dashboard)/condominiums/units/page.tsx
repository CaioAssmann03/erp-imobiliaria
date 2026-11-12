import type { Metadata } from "next";
import { Suspense } from "react";

import { UnitsEmptyState } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/UnitsEmptyState";

export const metadata: Metadata = { title: "Unidades" };

/**
 * `/condominiums/units` é o cadastro de unidades: escolhe-se o condomínio na coluna da esquerda (a moldura vem do layout).
 * Com `?pending=` (os atalhos de Pendências do painel) a lista da esquerda abre filtrada, de todos os condomínios.
 */
export default function UnitsPage() {
  return (
    <Suspense fallback={null}>
      <UnitsEmptyState />
    </Suspense>
  );
}
