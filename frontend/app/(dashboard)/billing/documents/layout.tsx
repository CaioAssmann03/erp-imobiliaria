import { Suspense } from "react";

import { BillingDocumentsFrame } from "./_components/list/BillingDocumentsFrame";

/** O escopo (condomínio e mês) viaja na URL e a moldura o lê no cliente: o `Suspense` é o que a página estática exige para isso. */
export default function BillingDocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <BillingDocumentsFrame>{children}</BillingDocumentsFrame>
    </Suspense>
  );
}
