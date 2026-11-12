import { Suspense } from "react";

import { CostCentersFrame } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCentersFrame";

/** `useSearchParams` (o `?condominium=` da tela vazia) precisa de um limite de Suspense para a página poder ser prerenderizada. */
export default function CostCentersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CostCentersFrame>{children}</CostCentersFrame>
    </Suspense>
  );
}
