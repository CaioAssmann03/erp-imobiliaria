import { Suspense } from "react";

import { BillingRunsFrame } from "./_components/BillingRunsFrame";

/** O escopo (condomínio e mês) viaja na URL e a moldura o lê no cliente: o `Suspense` é o que a página estática exige para isso. */
export default function BillingRunsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <BillingRunsFrame>{children}</BillingRunsFrame>
    </Suspense>
  );
}
