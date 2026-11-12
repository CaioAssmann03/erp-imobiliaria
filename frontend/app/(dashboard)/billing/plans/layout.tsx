import { Suspense } from "react";

import { BillingPlansFrame } from "./_components/BillingPlansFrame";

/** O condomínio viaja na URL e a moldura o lê no cliente: o `Suspense` é o que a página estática exige para isso. */
export default function BillingPlansLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <BillingPlansFrame>{children}</BillingPlansFrame>
    </Suspense>
  );
}
