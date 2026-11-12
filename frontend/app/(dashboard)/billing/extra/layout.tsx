import { Suspense } from "react";

import { ExtraBillingFrame } from "./_components/ExtraBillingFrame";

/** O condomínio viaja na URL e a moldura o lê no cliente: o `Suspense` é o que a página estática exige para isso. */
export default function ExtraBillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ExtraBillingFrame>{children}</ExtraBillingFrame>
    </Suspense>
  );
}
